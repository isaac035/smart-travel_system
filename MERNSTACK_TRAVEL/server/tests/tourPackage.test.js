/**
 * Unit Tests: Tour Package – Price Calculation, Validation, and Filtering
 *
 * Run with:  npx jest tests/tourPackage.test.js --verbose
 * (after: npm install --save-dev jest)
 *
 * No MongoDB connection required — all tests use pure logic functions.
 */

const {
  calculateTotalPrice,
  getVehicleCapacity,
  validateBookingInput,
  validatePackageInput,
  filterPackages,
} = require('../utils/tourValidator');

// ════════════════════════════════════════════════════════════════
//  1. Price Calculation
// ════════════════════════════════════════════════════════════════

describe('calculateTotalPrice()', () => {
  const base = { basePrice: 200, baseDuration: 4 };

  test('returns correct total for default duration, 1 traveler, no multiplier', () => {
    // pricePerDay = 200/4 = 50; total = 50 * 4 * 1 * 1 = 200
    expect(calculateTotalPrice({ ...base, customDuration: 4, vehicleMultiplier: 1, travelers: 1 })).toBe(200);
  });

  test('scales correctly with multiple travelers', () => {
    // 50 * 4 * 1 * 3 = 600
    expect(calculateTotalPrice({ ...base, customDuration: 4, vehicleMultiplier: 1, travelers: 3 })).toBe(600);
  });

  test('applies vehicle multiplier (van = 1.3)', () => {
    // 50 * 4 * 1.3 * 2 = 520
    expect(calculateTotalPrice({ ...base, customDuration: 4, vehicleMultiplier: 1.3, travelers: 2 })).toBeCloseTo(520, 2);
  });

  test('charges extra for extended duration', () => {
    // pricePerDay = 50; 6 days * 1 * 2 travelers = 600
    expect(calculateTotalPrice({ ...base, customDuration: 6, vehicleMultiplier: 1, travelers: 2 })).toBe(600);
  });

  test('charges less for shortened duration', () => {
    // pricePerDay = 50; 2 days * 1 * 1 = 100
    expect(calculateTotalPrice({ ...base, customDuration: 2, vehicleMultiplier: 1, travelers: 1 })).toBe(100);
  });

  test('treats customDuration = 0 as 1 day (minimum)', () => {
    // max(1, 0) = 1; 50 * 1 * 1 * 1 = 50
    expect(calculateTotalPrice({ ...base, customDuration: 0, vehicleMultiplier: 1, travelers: 1 })).toBe(50);
  });

  test('uses baseDuration when customDuration is null', () => {
    expect(calculateTotalPrice({ ...base, customDuration: null, vehicleMultiplier: 1, travelers: 1 })).toBe(200);
  });
});

// ════════════════════════════════════════════════════════════════
//  2. Vehicle Capacity
// ════════════════════════════════════════════════════════════════

describe('getVehicleCapacity()', () => {
  test('returns default capacity for car (4)', () => {
    expect(getVehicleCapacity('car')).toBe(4);
  });

  test('returns default capacity for van (8)', () => {
    expect(getVehicleCapacity('van')).toBe(8);
  });

  test('returns default capacity for bus (50)', () => {
    expect(getVehicleCapacity('bus')).toBe(50);
  });

  test('returns package-defined override', () => {
    expect(getVehicleCapacity('van', { van: 12 })).toBe(12);
  });

  test('falls back to default when pkg override not set for that vehicle', () => {
    expect(getVehicleCapacity('car', { van: 12 })).toBe(4);
  });
});

// ════════════════════════════════════════════════════════════════
//  3. Booking Validation
// ════════════════════════════════════════════════════════════════

const tomorrow = (() => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
})();

const yesterday = (() => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
})();

const mockPkg = {
  vehicleOptions: ['car', 'van', 'bus'],
  maxTravelersByVehicle: { car: 4, van: 8, bus: 50 },
};

const validBooking = {
  packageId: '64abc123',
  vehicle: 'car',
  travelers: '2',
  customDuration: '3',
  startDate: tomorrow,
};

describe('validateBookingInput()', () => {
  test('returns no errors for a valid booking', () => {
    expect(validateBookingInput(validBooking, mockPkg)).toHaveLength(0);
  });

  test('returns error when packageId is missing', () => {
    const input = { ...validBooking, packageId: '' };
    const errors = validateBookingInput(input, mockPkg);
    expect(errors.some((e) => e.includes('packageId'))).toBe(true);
  });

  test('returns error when vehicle is missing', () => {
    const input = { ...validBooking, vehicle: '' };
    const errors = validateBookingInput(input, mockPkg);
    expect(errors.some((e) => e.includes('vehicle'))).toBe(true);
  });

  test('returns error when startDate is missing', () => {
    const input = { ...validBooking, startDate: '' };
    const errors = validateBookingInput(input, mockPkg);
    expect(errors.some((e) => e.includes('startDate'))).toBe(true);
  });

  test('returns error for past startDate', () => {
    const input = { ...validBooking, startDate: yesterday };
    const errors = validateBookingInput(input, mockPkg);
    expect(errors.some((e) => e.includes('future'))).toBe(true);
  });

  test('returns error for invalid date string', () => {
    const input = { ...validBooking, startDate: 'not-a-date' };
    const errors = validateBookingInput(input, mockPkg);
    expect(errors.some((e) => e.includes('valid date'))).toBe(true);
  });

  test('returns error for travelers = 0', () => {
    const input = { ...validBooking, travelers: '0' };
    const errors = validateBookingInput(input, mockPkg);
    expect(errors.some((e) => e.includes('travelers'))).toBe(true);
  });

  test('returns error for travelers > 50', () => {
    const input = { ...validBooking, travelers: '51' };
    const errors = validateBookingInput(input, mockPkg);
    expect(errors.some((e) => e.includes('travelers'))).toBe(true);
  });

  test('returns error when travelers exceed vehicle capacity (car max 4)', () => {
    const input = { ...validBooking, travelers: '5', vehicle: 'car' };
    const errors = validateBookingInput(input, mockPkg);
    expect(errors.some((e) => e.includes('car'))).toBe(true);
  });

  test('allows 8 travelers in a van', () => {
    const input = { ...validBooking, travelers: '8', vehicle: 'van' };
    expect(validateBookingInput(input, mockPkg)).toHaveLength(0);
  });

  test('returns error when travelers exceed van capacity (8)', () => {
    const input = { ...validBooking, travelers: '9', vehicle: 'van' };
    const errors = validateBookingInput(input, mockPkg);
    expect(errors.some((e) => e.includes('van'))).toBe(true);
  });

  test('returns error for vehicle not in package options', () => {
    const limited = { ...mockPkg, vehicleOptions: ['car'] };
    const input = { ...validBooking, vehicle: 'bus' };
    const errors = validateBookingInput(input, limited);
    expect(errors.some((e) => e.includes('bus'))).toBe(true);
  });

  test('returns error for invalid vehicle type', () => {
    const input = { ...validBooking, vehicle: 'helicopter' };
    const errors = validateBookingInput(input, mockPkg);
    expect(errors.some((e) => e.includes('vehicle'))).toBe(true);
  });

  test('returns error for customDuration > 60', () => {
    const input = { ...validBooking, customDuration: '61' };
    const errors = validateBookingInput(input, mockPkg);
    expect(errors.some((e) => e.includes('customDuration'))).toBe(true);
  });

  test('returns error for customDuration < 1', () => {
    const input = { ...validBooking, customDuration: '0' };
    const errors = validateBookingInput(input, mockPkg);
    expect(errors.some((e) => e.includes('customDuration'))).toBe(true);
  });

  test('accepts customDuration within range (1–60)', () => {
    const input = { ...validBooking, customDuration: '30' };
    expect(validateBookingInput(input, mockPkg)).toHaveLength(0);
  });
});

// ════════════════════════════════════════════════════════════════
//  4. Package (Admin) Validation
// ════════════════════════════════════════════════════════════════

const validPackage = {
  name: 'Hill Country Trek',
  description: 'A beautiful trek through the highlands',
  duration: 5,
  basePrice: 150,
  vehicleOptions: ['car', 'van'],
};

describe('validatePackageInput()', () => {
  test('returns no errors for a valid package', () => {
    expect(validatePackageInput(validPackage)).toHaveLength(0);
  });

  test('returns error when name is missing', () => {
    const errors = validatePackageInput({ ...validPackage, name: '' });
    expect(errors.some((e) => e.includes('name'))).toBe(true);
  });

  test('returns error when description is missing', () => {
    const errors = validatePackageInput({ ...validPackage, description: '' });
    expect(errors.some((e) => e.includes('description'))).toBe(true);
  });

  test('returns error when duration is 0', () => {
    const errors = validatePackageInput({ ...validPackage, duration: 0 });
    expect(errors.some((e) => e.includes('duration'))).toBe(true);
  });

  test('returns error when duration is > 60', () => {
    const errors = validatePackageInput({ ...validPackage, duration: 90 });
    expect(errors.some((e) => e.includes('duration'))).toBe(true);
  });

  test('returns error when basePrice is 0 or negative', () => {
    const errors = validatePackageInput({ ...validPackage, basePrice: -10 });
    expect(errors.some((e) => e.includes('basePrice'))).toBe(true);
  });

  test('returns error for invalid vehicle options', () => {
    const errors = validatePackageInput({ ...validPackage, vehicleOptions: ['car', 'jet'] });
    expect(errors.some((e) => e.includes('jet'))).toBe(true);
  });

  test('accepts package without vehicleOptions', () => {
    const { vehicleOptions, ...noVehicle } = validPackage;
    expect(validatePackageInput(noVehicle)).toHaveLength(0);
  });
});

// ════════════════════════════════════════════════════════════════
//  5. Package Filtering
// ════════════════════════════════════════════════════════════════

const packages = [
  { name: 'Galle Fort Tour', description: 'Historic south coast trip', destination: 'Galle', basePrice: 120, duration: 2, vehicleOptions: ['car'] },
  { name: 'Sigiriya Adventure', description: 'Rock fortress and wildlife', destination: 'Sigiriya', basePrice: 350, duration: 5, vehicleOptions: ['van', 'car'] },
  { name: 'Ella Mountains', description: 'Scenic hill country', destination: 'Ella', basePrice: 80, duration: 3, vehicleOptions: ['car', 'bus'] },
  { name: 'Yala Safari', description: 'Wildlife safari experience', destination: 'Yala', basePrice: 500, duration: 7, vehicleOptions: ['van', 'bus'] },
  { name: 'Colombo City Tour', description: 'vibrant capital city visit', destination: 'Colombo', basePrice: 60, duration: 1, vehicleOptions: ['car'] },
];

describe('filterPackages()', () => {
  test('returns all packages when no filter applied', () => {
    expect(filterPackages(packages, {})).toHaveLength(5);
  });

  test('filters by destination (case-insensitive substring)', () => {
    const result = filterPackages(packages, { destination: 'ella' });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Ella Mountains');
  });

  test('filters by minPrice', () => {
    const result = filterPackages(packages, { minPrice: '300' });
    expect(result.every((p) => p.basePrice >= 300)).toBe(true);
    expect(result).toHaveLength(2);
  });

  test('filters by maxPrice', () => {
    const result = filterPackages(packages, { maxPrice: '100' });
    expect(result.every((p) => p.basePrice <= 100)).toBe(true);
    expect(result).toHaveLength(2);
  });

  test('filters by price range', () => {
    const result = filterPackages(packages, { minPrice: '100', maxPrice: '400' });
    expect(result).toHaveLength(2); // Galle (120) and Sigiriya (350)
  });

  test('filters by minDuration', () => {
    const result = filterPackages(packages, { minDuration: '5' });
    expect(result.every((p) => p.duration >= 5)).toBe(true);
    expect(result).toHaveLength(2);
  });

  test('filters by maxDuration', () => {
    const result = filterPackages(packages, { maxDuration: '2' });
    expect(result.every((p) => p.duration <= 2)).toBe(true);
    expect(result).toHaveLength(2);
  });

  test('filters by duration range', () => {
    const result = filterPackages(packages, { minDuration: '3', maxDuration: '5' });
    expect(result).toHaveLength(2); // Ella (3) and Sigiriya (5)
  });

  test('filters by vehicle type', () => {
    const result = filterPackages(packages, { vehicle: 'bus' });
    expect(result.every((p) => p.vehicleOptions.includes('bus'))).toBe(true);
    expect(result).toHaveLength(2); // Ella and Yala
  });

  test('filters by text search (name)', () => {
    const result = filterPackages(packages, { search: 'safari' });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Yala Safari');
  });

  test('filters by text search (description)', () => {
    const result = filterPackages(packages, { search: 'historic' });
    expect(result).toHaveLength(1);
    expect(result[0].destination).toBe('Galle');
  });

  test('returns empty array when no match', () => {
    const result = filterPackages(packages, { destination: 'Kandy' });
    expect(result).toHaveLength(0);
  });

  test('combines multiple filters (destination + vehicle)', () => {
    const result = filterPackages(packages, { vehicle: 'van', maxPrice: '400' });
    // Sigiriya (350, van) and Yala (500 — excluded by maxPrice)
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Sigiriya Adventure');
  });
});
