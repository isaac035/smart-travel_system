const axios = require('axios');

const ORS_BASE = 'https://api.openrouteservice.org';
const OSRM_BASE = 'https://router.project-osrm.org';

// POST /api/routes/matrix
// Body: { locations: [[lng, lat], [lng, lat], ...] }
exports.getMatrix = async (req, res) => {
  try {
    const { locations } = req.body;
    if (!locations || locations.length < 2) {
      return res.status(400).json({ message: 'At least 2 locations required' });
    }

    // Try ORS first with extended radius for remote locations
    try {
      const response = await axios.post(
        `${ORS_BASE}/v2/matrix/driving-car`,
        {
          locations,
          metrics: ['distance', 'duration'],
          resolve_locations: true,
          radiuses: locations.map(() => 5000),
        },
        {
          headers: {
            Authorization: process.env.ORS_API_KEY,
            'Content-Type': 'application/json',
          },
        }
      );
      return res.json(response.data);
    } catch (orsErr) {
      console.warn('ORS matrix failed, falling back to OSRM:', orsErr.response?.data?.error?.message || orsErr.message);
    }

    // Fallback: OSRM table API
    const coordStr = locations.map(([lng, lat]) => `${lng},${lat}`).join(';');
    const osrmRes = await fetch(
      `${OSRM_BASE}/table/v1/driving/${coordStr}?annotations=distance,duration`
    );
    const osrmData = await osrmRes.json();
    if (osrmData.code !== 'Ok') throw new Error(osrmData.message || 'OSRM table failed');
    res.json({
      distances: osrmData.distances,
      durations: osrmData.durations,
    });
  } catch (err) {
    const status = err.response?.status || 500;
    const message = err.response?.data?.error?.message || err.message;
    res.status(status).json({ message });
  }
};

// POST /api/routes/directions
// Body: { coordinates: [[lng, lat], [lng, lat], ...] }
exports.getDirections = async (req, res) => {
  try {
    const { coordinates } = req.body;
    if (!coordinates || coordinates.length < 2) {
      return res.status(400).json({ message: 'At least 2 coordinates required' });
    }

    // Try ORS first with extended radius (5km) for remote/park locations
    try {
      const response = await axios.post(
        `${ORS_BASE}/v2/directions/driving-car/geojson`,
        {
          coordinates,
          radiuses: coordinates.map(() => 5000),
        },
        {
          headers: {
            Authorization: process.env.ORS_API_KEY,
            'Content-Type': 'application/json',
          },
        }
      );
      return res.json(response.data);
    } catch (orsErr) {
      console.warn('ORS directions failed, falling back to OSRM:', orsErr.response?.data?.error?.message || orsErr.message);
    }

    // Fallback: OSRM route API (free, no key, real road routes)
    const coordStr = coordinates.map(([lng, lat]) => `${lng},${lat}`).join(';');
    const osrmRes = await fetch(
      `${OSRM_BASE}/route/v1/driving/${coordStr}?overview=full&geometries=geojson&steps=false`
    );
    const osrmData = await osrmRes.json();
    if (osrmData.code !== 'Ok') throw new Error(osrmData.message || 'OSRM route failed');

    // Convert OSRM response to GeoJSON FeatureCollection (same format as ORS)
    const route = osrmData.routes[0];
    const geojson = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: route.geometry,
        properties: {
          summary: {
            distance: route.distance,
            duration: route.duration,
          },
          segments: route.legs.map(leg => ({
            distance: leg.distance,
            duration: leg.duration,
          })),
        },
      }],
    };
    res.json(geojson);
  } catch (err) {
    const status = err.response?.status || 500;
    const message = err.response?.data?.error?.message || err.message;
    res.status(status).json({ message });
  }
};
