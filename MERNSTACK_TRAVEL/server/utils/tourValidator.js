/**
 * Pure validation & business-logic utilities for Tour Packages.
 * Kept separate from the controller so they can be unit-tested without a DB.
 */

const VALID_VEHICLES = ['car', 'van', 'bus'];
const DEFAULT_CAPACITY = { car: 4, van: 8, bus: 50 };

/* ─────────────────────────────────────────────
   Price Calculation
───────────────────────────────────────────── */

/**
 * Calculate the total booking price.
 * @param {object} params
 * @param {number} params.basePrice       - Package base price (full package, not per-day)
 * @param {number} params.baseDuration    - Package default duration in days
 * @param {number} params.customDuration  - User-chosen duration in days
 * @param {number} params.vehicleMultiplier
 * @param {number} params.travelers
 * @returns {number} totalPrice
 */
function calculateTotalPrice({ basePrice, baseDuration, customDuration, vehicleMultiplier, travelers }) {
  const dur = Math.max(1, Number(customDuration) || baseDuration);
  const pricePerDay = basePrice / Math.max(1, baseDuration);
  return pricePerDay * dur * (vehicleMultiplier || 1) * Math.max(1, travelers);
}

/**
 * Return the max traveler count for a given vehicle, merging package overrides.
 */
function getVehicleCapacity(vehicle, pkgMaxByVehicle = {}) {
  return pkgMaxByVehicle[vehicle] ?? DEFAULT_CAPACITY[vehicle] ?? 50;
}

/* ─────────────────────────────────────────────
   Booking Validation
───────────────────────────────────────────── */

/**
 * Validate a booking request body.
 * Returns an array of error strings (empty = valid).
 * @param {object} body   - { packageId, vehicle, travelers, customDuration, startDate }
 * @param {object} pkg    - Mongoose TourPackage document (or plain object for tests)
 */
function validateBookingInput(body, pkg) {
  const errors = [];
  const { packageId, vehicle, travelers, customDuration, startDate } = body;

  // Required fields
  if (!packageId) errors.push('packageId is required.');
  if (!vehicle)   errors.push('vehicle is required.');
  if (!startDate) errors.push('startDate is required.');

  // Vehicle must be valid and available in this package
  if (vehicle) {
    if (!VALID_VEHICLES.includes(vehicle)) {
      errors.push(`vehicle must be one of: ${VALID_VEHICLES.join(', ')}.`);
    } else if (pkg?.vehicleOptions?.length && !pkg.vehicleOptions.includes(vehicle)) {
      errors.push(`Vehicle '${vehicle}' is not available for this package. Available: ${pkg.vehicleOptions.join(', ')}.`);
    }
  }

  // Travelers: 1 – 50
  const t = Number(travelers);
  if (!travelers && travelers !== 0) {
    errors.push('travelers is required.');
  } else if (!Number.isInteger(t) || t < 1 || t > 50) {
    errors.push('travelers must be a whole number between 1 and 50.');
  }

  // Custom duration: 1 – 60
  if (customDuration !== undefined && customDuration !== null && customDuration !== '') {
    const d = Number(customDuration);
    if (!Number.isInteger(d) || d < 1 || d > 60) {
      errors.push('customDuration must be a whole number between 1 and 60 days.');
    }
  }

  // Start date must be today or future
  if (startDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const chosen = new Date(startDate);
    if (isNaN(chosen.getTime())) {
      errors.push('startDate is not a valid date.');
    } else if (chosen < today) {
      errors.push('startDate must be today or a future date.');
    }
  }

  // Capacity check (only if travelers and vehicle are otherwise valid)
  if (pkg && vehicle && VALID_VEHICLES.includes(vehicle) && Number.isInteger(t) && t >= 1) {
    const capacity = getVehicleCapacity(vehicle, pkg.maxTravelersByVehicle);
    if (t > capacity) {
      errors.push(
        `A ${vehicle} can accommodate a maximum of ${capacity} traveler${capacity !== 1 ? 's' : ''}. ` +
        `Please choose a larger vehicle or reduce the number of travelers.`
      );
    }
  }

  return errors;
}

/* ─────────────────────────────────────────────
   Package (Admin) Validation
───────────────────────────────────────────── */

/**
 * Validate create/update package body.
 * Returns an array of error strings (empty = valid).
 */
function validatePackageInput(body) {
  const errors = [];
  const { name, description, duration, basePrice, vehicleOptions } = body;

  if (!name || String(name).trim().length === 0)        errors.push('name is required.');
  if (!description || String(description).trim().length === 0) errors.push('description is required.');

  const dur = Number(duration);
  if (!duration && duration !== 0)                       errors.push('duration is required.');
  else if (!Number.isInteger(dur) || dur < 1 || dur > 60) errors.push('duration must be a whole number between 1 and 60.');

  const price = Number(basePrice);
  if (!basePrice && basePrice !== 0)                     errors.push('basePrice is required.');
  else if (isNaN(price) || price <= 0)                   errors.push('basePrice must be a positive number.');

  if (vehicleOptions && !Array.isArray(vehicleOptions)) {
    errors.push('vehicleOptions must be an array.');
  } else if (vehicleOptions) {
    const invalid = vehicleOptions.filter((v) => !VALID_VEHICLES.includes(v));
    if (invalid.length) errors.push(`Invalid vehicle options: ${invalid.join(', ')}. Allowed: ${VALID_VEHICLES.join(', ')}.`);
  }

  return errors;
}

/* ─────────────────────────────────────────────
   Filtering Helper
───────────────────────────────────────────── */

/**
 * Filter an array of package objects by query criteria.
 * Works for both Mongoose docs (with .toObject()) and plain objects.
 * @param {Array}  packages
 * @param {object} query  - { destination, minPrice, maxPrice, minDuration, maxDuration, vehicle, search }
 * @returns {Array}
 */
function filterPackages(packages, query = {}) {
  const { destination, minPrice, maxPrice, minDuration, maxDuration, vehicle, search } = query;

  return packages.filter((pkg) => {
    // Destination (case-insensitive substring)
    if (destination && !(pkg.destination || '').toLowerCase().includes(destination.toLowerCase())) {
      return false;
    }

    // Price range
    if (minPrice !== undefined && pkg.basePrice < Number(minPrice)) return false;
    if (maxPrice !== undefined && pkg.basePrice > Number(maxPrice)) return false;

    // Duration range
    if (minDuration !== undefined && pkg.duration < Number(minDuration)) return false;
    if (maxDuration !== undefined && pkg.duration > Number(maxDuration)) return false;

    // Vehicle must be in package's vehicleOptions
    if (vehicle) {
      const opts = pkg.vehicleOptions || [];
      if (!opts.includes(vehicle)) return false;
    }

    // Text search (name, description, destination)
    if (search) {
      const q = search.toLowerCase();
      const inName = (pkg.name || '').toLowerCase().includes(q);
      const inDesc = (pkg.description || '').toLowerCase().includes(q);
      const inDest = (pkg.destination || '').toLowerCase().includes(q);
      if (!inName && !inDesc && !inDest) return false;
    }

    return true;
  });
}

module.exports = {
  calculateTotalPrice,
  getVehicleCapacity,
  validateBookingInput,
  validatePackageInput,
  filterPackages,
  VALID_VEHICLES,
  DEFAULT_CAPACITY,
};
