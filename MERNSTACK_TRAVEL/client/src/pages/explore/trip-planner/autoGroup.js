import api from '../../../utils/api';

const PACE_LIMITS = {
  relaxed: { min: 2, max: 3 },
  moderate: { min: 4, max: 5 },
  packed: { min: 6, max: 7 },
};

/**
 * Get distance matrix from OpenRouteService via our backend proxy.
 */
export async function getDistanceMatrix(points) {
  const locations = points.map((p) => [p.lng, p.lat]);
  const { data } = await api.post('/routes/matrix', { locations });
  return data;
}

/**
 * Get route directions (polyline) from OpenRouteService.
 */
export async function getRouteDirections(points) {
  const coordinates = points.map((p) => [p.lng, p.lat]);
  const { data } = await api.post('/routes/directions', { coordinates });
  return data;
}

/**
 * Optimize route order within each pre-assigned day using nearest-neighbor.
 *
 * @param {Object} startPoint - { lat, lng }
 * @param {Object} locationsByDay - { 1: [loc, ...], 2: [loc, ...], ... }
 * @param {number} totalDays - Total number of trip days
 * @param {boolean} reverse - If true, start from farthest location within each day
 * @returns {{ days: Array, warning: string|null }}
 */
export async function optimizeDayRoutes(startPoint, locationsByDay, totalDays, reverse = false) {
  const days = [];
  let lastPoint = startPoint;

  for (let dayNum = 1; dayNum <= totalDays; dayNum++) {
    const dayLocs = locationsByDay[dayNum] || [];

    if (dayLocs.length === 0) {
      days.push({ dayNumber: dayNum, locations: [] });
      continue;
    }

    const validLocs = dayLocs.filter((l) => l.coordinates?.lat && l.coordinates?.lng);
    if (validLocs.length === 0) {
      days.push({
        dayNumber: dayNum,
        locations: dayLocs.map((l) => ({ location: l, distFromPrev: 0, durationFromPrev: 0 })),
      });
      continue;
    }

    if (validLocs.length === 1) {
      const pts = [lastPoint, validLocs[0].coordinates];
      let matrix;
      try {
        matrix = await getDistanceMatrix(pts);
      } catch {
        matrix = buildHaversineMatrix(pts);
      }
      days.push({
        dayNumber: dayNum,
        locations: [{
          location: validLocs[0],
          distFromPrev: matrix.distances[0][1],
          durationFromPrev: matrix.durations[0][1],
        }],
      });
      lastPoint = validLocs[0].coordinates;
      continue;
    }

    // Multiple locations — optimize order
    const allPoints = [lastPoint, ...validLocs.map((l) => l.coordinates)];
    let matrix;
    try {
      matrix = await getDistanceMatrix(allPoints);
    } catch {
      matrix = buildHaversineMatrix(allPoints);
    }

    const visited = new Set();
    const ordered = [];
    let currentIdx = 0;

    if (reverse) {
      // Start from farthest location in this day
      let maxDist = 0;
      let farthestIdx = 1;
      for (let i = 1; i < allPoints.length; i++) {
        if (matrix.distances[0][i] > maxDist) {
          maxDist = matrix.distances[0][i];
          farthestIdx = i;
        }
      }
      visited.add(farthestIdx);
      ordered.push({
        location: validLocs[farthestIdx - 1],
        distFromPrev: matrix.distances[0][farthestIdx],
        durationFromPrev: matrix.durations[0][farthestIdx],
      });
      currentIdx = farthestIdx;
    }

    while (ordered.length < validLocs.length) {
      let nearest = -1;
      let nearestDist = Infinity;
      for (let i = 1; i < allPoints.length; i++) {
        if (visited.has(i)) continue;
        if (matrix.distances[currentIdx][i] < nearestDist) {
          nearestDist = matrix.distances[currentIdx][i];
          nearest = i;
        }
      }
      if (nearest === -1) break;
      visited.add(nearest);
      ordered.push({
        location: validLocs[nearest - 1],
        distFromPrev: matrix.distances[currentIdx][nearest],
        durationFromPrev: matrix.durations[currentIdx][nearest],
      });
      currentIdx = nearest;
    }

    days.push({ dayNumber: dayNum, locations: ordered });
    if (ordered.length > 0) {
      lastPoint = ordered[ordered.length - 1].location.coordinates;
    }
  }

  return { days, warning: null };
}

/**
 * Legacy: Auto-group selected locations into days using nearest-neighbor clustering.
 */
export async function autoGroupLocations(startPoint, locations, numDays, pace, reverse = false) {
  const maxPerDay = PACE_LIMITS[pace]?.max || 5;
  const totalCapacity = maxPerDay * numDays;

  let warning = null;
  if (locations.length > totalCapacity) {
    warning = `You have ${locations.length} locations but only ${totalCapacity} slots (${numDays} days x ${maxPerDay} stops). Consider adding more days or switching to a faster pace.`;
  }

  const validLocations = locations.filter((l) => l.coordinates?.lat && l.coordinates?.lng);
  if (validLocations.length === 0) return { days: [], warning: 'No locations with valid coordinates.' };

  const allPoints = [startPoint, ...validLocations.map((l) => l.coordinates)];

  let matrix;
  try {
    matrix = await getDistanceMatrix(allPoints);
  } catch {
    matrix = buildHaversineMatrix(allPoints);
  }

  const distances = matrix.distances;
  const durations = matrix.durations;

  const visited = new Set();
  const days = [];
  let currentIdx = 0;

  if (reverse) {
    let maxDist = 0;
    let farthestIdx = 1;
    for (let i = 1; i < allPoints.length; i++) {
      if (distances[0][i] > maxDist) {
        maxDist = distances[0][i];
        farthestIdx = i;
      }
    }
    visited.add(farthestIdx);
    days.push({
      dayNumber: 1,
      locations: [{ location: validLocations[farthestIdx - 1], distFromPrev: distances[0][farthestIdx], durationFromPrev: durations[0][farthestIdx] }],
    });
    currentIdx = farthestIdx;
  }

  for (let day = days.length; day < numDays; day++) {
    const dayLocations = [];
    while (dayLocations.length < maxPerDay) {
      let nearest = -1;
      let nearestDist = Infinity;
      for (let i = 1; i < allPoints.length; i++) {
        if (visited.has(i)) continue;
        const dist = distances[currentIdx][i];
        if (dist < nearestDist) {
          nearestDist = dist;
          nearest = i;
        }
      }
      if (nearest === -1) break;
      visited.add(nearest);
      dayLocations.push({
        location: validLocations[nearest - 1],
        distFromPrev: distances[currentIdx][nearest],
        durationFromPrev: durations[currentIdx][nearest],
      });
      currentIdx = nearest;
    }
    if (dayLocations.length > 0) {
      days.push({ dayNumber: day + 1, locations: dayLocations });
    }
  }

  return { days, warning };
}

function buildHaversineMatrix(points) {
  const n = points.length;
  const distances = Array.from({ length: n }, () => Array(n).fill(0));
  const durations = Array.from({ length: n }, () => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const d = haversine(points[i], points[j]);
      distances[i][j] = d;
      durations[i][j] = (d / 1000 / 50) * 3600;
    }
  }
  return { distances, durations };
}

function haversine(a, b) {
  const R = 6371000;
  const toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Calculate per-day and total distances from grouped days.
 */
export function calculateTripStats(days) {
  let totalDistance = 0;
  let totalDuration = 0;

  const dayStats = days.map((day) => {
    let dayDist = 0;
    let dayDur = 0;
    day.locations.forEach((loc) => {
      dayDist += loc.distFromPrev || 0;
      dayDur += loc.durationFromPrev || 0;
    });
    totalDistance += dayDist;
    totalDuration += dayDur;
    return {
      dayNumber: day.dayNumber,
      stops: day.locations.length,
      distance: dayDist,
      duration: dayDur,
    };
  });

  return { dayStats, totalDistance, totalDuration };
}
