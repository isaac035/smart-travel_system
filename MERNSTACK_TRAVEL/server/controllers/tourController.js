const TourPackage = require('../models/TourPackage');
const TourBooking = require('../models/TourBooking');
const GuideBooking = require('../models/GuideBooking');
const { upload } = require('../config/cloudinary');
const {
  validateBookingInput,
  validatePackageInput,
  calculateTotalPrice,
  filterPackages,
} = require('../utils/tourValidator');

// Statuses that mean the GuideBooking is still active (blocks the guide)
const GUIDE_BOOKING_ACTIVE_STATUSES = [
  'deposit_submitted',
  'pending_guide_review',
  'guide_accepted',
  'under_admin_review',
  'admin_confirmed',
  'remaining_payment_pending',
  'remaining_payment_submitted',
  'fully_paid',
  'completed',
];

// ── Price Preview ─────────────────────────────────────────────────

// POST /api/tours/calculate-price  (public — price preview only)
exports.calculatePrice = async (req, res) => {
  try {
    const { packageId, vehicle, travelers, customDuration } = req.body;
    const pkg = await TourPackage.findById(packageId);
    if (!pkg) return res.status(404).json({ message: 'Package not found' });

    const multiplier = pkg.vehicleMultipliers?.[vehicle] || 1;
    const baseDur = pkg.duration || 1;
    const dur = Math.max(1, Number(customDuration) || baseDur);
    const t = Math.max(1, Number(travelers) || 1);
    const pricePerDay = pkg.basePrice / baseDur;
    const totalPrice = pricePerDay * dur * multiplier * t;
    const vehicleCapacity =
      pkg.maxTravelersByVehicle?.[vehicle] ??
      (vehicle === 'car' ? 4 : vehicle === 'van' ? 8 : 50);

    res.json({
      basePrice: pkg.basePrice,
      pricePerDay,
      vehicleMultiplier: multiplier,
      travelers: t,
      customDuration: dur,
      baseDuration: baseDur,
      totalPrice,
      vehicleCapacity,
      exceedsCapacity: t > vehicleCapacity,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ── Package CRUD ──────────────────────────────────────────────────

// GET /api/tours  — supports optional filter query params:
//   ?destination=&minPrice=&maxPrice=&minDuration=&maxDuration=&vehicle=&search=
exports.getPackages = async (req, res) => {
  try {
    const allPackages = await TourPackage.find({ isActive: true })
      .populate('locations', 'name district province')
      .populate('guideIds', 'name avatar rating');

    // Apply optional server-side filtering
    const { destination, minPrice, maxPrice, minDuration, maxDuration, vehicle, search } = req.query;
    const hasFilter = destination || minPrice || maxPrice || minDuration || maxDuration || vehicle || search;

    const result = hasFilter
      ? filterPackages(allPackages.map((p) => p.toObject()), req.query)
      : allPackages;

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/tours/:id
exports.getPackage = async (req, res) => {
  try {
    const pkg = await TourPackage.findById(req.params.id)
      .populate('locations', 'name district province category coordinates images')
      .populate('guideIds', 'name image rating languages pricePerDay phone location');
    if (!pkg) return res.status(404).json({ message: 'Package not found' });
    res.json(pkg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/tours/:id/available-guides?startDate=YYYY-MM-DD&duration=N
// duration = number of days the new trip will last (defaults to package duration)
exports.getAvailableGuides = async (req, res) => {
  try {
    const { startDate, duration } = req.query;
    const pkg = await TourPackage.findById(req.params.id)
      .populate('guideIds', 'name image rating languages pricePerDay phone experience location');
    if (!pkg) return res.status(404).json({ message: 'Package not found' });

    if (!pkg.guideIds || pkg.guideIds.length === 0) return res.json([]);

    if (!startDate) return res.json(pkg.guideIds);

    const guideObjectIds = pkg.guideIds.map((g) => g._id);

    // Build the NEW trip's date window
    const dur = Math.max(1, parseInt(duration, 10) || pkg.duration || 1);
    const tripStart = new Date(startDate);
    tripStart.setHours(0, 0, 0, 0);
    const tripEnd = new Date(tripStart);
    tripEnd.setDate(tripEnd.getDate() + dur - 1);
    tripEnd.setHours(23, 59, 59, 999);

    // ── Check 1: TourBooking conflicts (same package module) ────────
    // An existing TourBooking blocks a guide if its window [bookingStart, bookingStart + customDuration - 1]
    // overlaps the new trip window [tripStart, tripEnd].
    // Since TourBooking has no endDate field, we use an aggregation to compute it in-memory:
    const allTourBookings = await TourBooking.find({
      guideId: { $in: guideObjectIds, $ne: null },
      status: { $in: ['pending', 'confirmed'] },
    }).select('guideId startDate customDuration');

    const tourBookedIds = allTourBookings
      .filter((b) => {
        const bStart = new Date(b.startDate);
        bStart.setHours(0, 0, 0, 0);
        const bDur = Math.max(1, b.customDuration || 1);
        const bEnd = new Date(bStart);
        bEnd.setDate(bEnd.getDate() + bDur - 1);
        bEnd.setHours(23, 59, 59, 999);
        // Overlap check: booking overlaps new trip if bStart <= tripEnd AND bEnd >= tripStart
        return bStart <= tripEnd && bEnd >= tripStart;
      })
      .map((b) => b.guideId.toString());

    // ── Check 2: GuideBooking conflicts (standalone guide module) ───
    // A guide is blocked if their booking window overlaps the new trip window
    const guideBookedIds = await GuideBooking.distinct('guideId', {
      guideId: { $in: guideObjectIds },
      status: { $in: GUIDE_BOOKING_ACTIVE_STATUSES },
      startDate: { $lte: tripEnd },
      endDate: { $gte: tripStart },
    });

    const bookedSet = new Set([
      ...tourBookedIds,
      ...guideBookedIds.map((id) => id.toString()),
    ]);

    const available = pkg.guideIds.filter((g) => !bookedSet.has(g._id.toString()));

    res.json(available);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/tours  (admin)
exports.createPackage = async (req, res) => {
  try {
    const body = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body;

    // Validate
    const errors = validatePackageInput(body);
    if (errors.length) return res.status(400).json({ message: errors.join(' ') });

    const images = req.files ? req.files.map((f) => f.path) : [];
    const pkg = await TourPackage.create({ ...body, images });
    res.status(201).json(pkg);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PUT /api/tours/:id  (admin)
exports.updatePackage = async (req, res) => {
  try {
    const body = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body;

    // Validate
    const errors = validatePackageInput(body);
    if (errors.length) return res.status(400).json({ message: errors.join(' ') });

    const existingImages = body.existingImages || [];
    delete body.existingImages;
    const newImages = req.files ? req.files.map((f) => f.path) : [];
    body.images = [...existingImages, ...newImages];

    const pkg = await TourPackage.findByIdAndUpdate(req.params.id, body, { new: true });
    if (!pkg) return res.status(404).json({ message: 'Package not found' });
    res.json(pkg);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE /api/tours/:id  (admin)
exports.deletePackage = async (req, res) => {
  try {
    const pkg = await TourPackage.findByIdAndDelete(req.params.id);
    if (!pkg) return res.status(404).json({ message: 'Package not found' });
    res.json({ message: 'Package deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Bookings ──────────────────────────────────────────────────────

// POST /api/tours/bookings  (user)
exports.createBooking = async (req, res) => {
  try {
    const {
      packageId, vehicle, travelers, customDuration, startDate, notes,
      cardHolder, cardNumber, expiryMonth, expiryYear, cvv, guideId,
    } = req.body;

    // Fetch package first so validator can check vehicle options & capacity
    const pkg = await TourPackage.findById(packageId);
    if (!pkg) return res.status(404).json({ message: 'Package not found' });

    // Notes length limit
    if (notes && String(notes).length > 500) {
      return res.status(400).json({ message: 'Special requests must be 500 characters or fewer.' });
    }

    // Run comprehensive validation
    const errors = validateBookingInput(req.body, pkg);
    if (errors.length) return res.status(400).json({ message: errors.join(' ') });

    // ── Card payment validation ──────────────────────────────────────
    if (!cardHolder || cardHolder.trim().length < 3) {
      return res.status(400).json({ message: 'Card holder name must be at least 3 characters.' });
    }
    const rawCard = String(cardNumber || '').replace(/\s/g, '');
    if (!/^\d{16}$/.test(rawCard)) {
      return res.status(400).json({ message: 'Card number must be exactly 16 digits.' });
    }
    const expM = parseInt(expiryMonth, 10);
    const expY = parseInt(expiryYear, 10);
    if (!expM || expM < 1 || expM > 12) {
      return res.status(400).json({ message: 'Invalid expiry month.' });
    }
    const now = new Date();
    const fullYear = expY < 100 ? 2000 + expY : expY;
    if (fullYear < now.getFullYear() || (fullYear === now.getFullYear() && expM < now.getMonth() + 1)) {
      return res.status(400).json({ message: 'Card has expired.' });
    }
    const rawCvv = String(cvv || '');
    if (!/^\d{3,4}$/.test(rawCvv)) {
      return res.status(400).json({ message: 'CVV must be 3 or 4 digits.' });
    }
    // ─────────────────────────────────────────────────────────────────

    // ── Guide availability validation ────────────────────────────────
    let resolvedGuideId = null;
    if (guideId) {
      // Ensure guide belongs to the package
      const guideInPackage = (pkg.guideIds || []).some((id) => id.toString() === guideId.toString());
      if (!guideInPackage) {
        return res.status(400).json({ message: 'Selected guide is not assigned to this package.' });
      }

      // Compute the new trip's full date window
      const tripDur = Math.max(1, Number(customDuration) || pkg.duration || 1);
      const tripStart = new Date(startDate);
      tripStart.setHours(0, 0, 0, 0);
      const tripEnd = new Date(tripStart);
      tripEnd.setDate(tripEnd.getDate() + tripDur - 1);
      tripEnd.setHours(23, 59, 59, 999);

      // Check 1: TourBooking conflict — any existing booking whose window overlaps the new trip window
      const allTourConflicts = await TourBooking.find({
        guideId,
        status: { $in: ['pending', 'confirmed'] },
      }).select('startDate customDuration');

      const hasTourConflict = allTourConflicts.some((b) => {
        const bStart = new Date(b.startDate);
        bStart.setHours(0, 0, 0, 0);
        const bDur = Math.max(1, b.customDuration || 1);
        const bEnd = new Date(bStart);
        bEnd.setDate(bEnd.getDate() + bDur - 1);
        bEnd.setHours(23, 59, 59, 999);
        return bStart <= tripEnd && bEnd >= tripStart;
      });

      if (hasTourConflict) {
        return res.status(400).json({ message: 'This guide is already booked during the selected trip dates. Please choose another guide or date.' });
      }

      // Check 2: GuideBooking conflict (standalone guide booking module)
      const guideConflict = await GuideBooking.findOne({
        guideId,
        status: { $in: GUIDE_BOOKING_ACTIVE_STATUSES },
        startDate: { $lte: tripEnd },
        endDate: { $gte: tripStart },
      });
      if (guideConflict) {
        return res.status(400).json({ message: 'This guide is unavailable during the selected trip dates (booked via another service). Please choose another guide or date.' });
      }

      resolvedGuideId = guideId;
    }
    // ─────────────────────────────────────────────────────────────────

    const multiplier = pkg.vehicleMultipliers[vehicle] || 1;
    const baseDur = pkg.duration || 1;
    const dur = Math.max(1, Number(customDuration) || baseDur);
    const pricePerDay = pkg.basePrice / baseDur;
    const totalPrice = pricePerDay * dur * multiplier * Number(travelers);

    const advancePaid = Math.round(totalPrice * 0.2 * 100) / 100;
    const remainingAmount = Math.round((totalPrice - advancePaid) * 100) / 100;

    const booking = await TourBooking.create({
      userId: req.user._id,
      packageId,
      guideId: resolvedGuideId,
      vehicle,
      travelers: Number(travelers),
      customDuration: dur,
      startDate,
      totalPrice,
      notes,
      payment: {
        cardHolder: cardHolder.trim(),
        cardLastFour: rawCard.slice(-4),
        advancePaid,
        remainingAmount,
        paymentStatus: 'advance_paid',
      },
    });
    res.status(201).json(booking);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


// GET /api/tours/bookings/my  (user)
exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await TourBooking.find({ userId: req.user._id })
      .populate('packageId', 'name images basePrice duration')
      .populate('guideId', 'name image phone rating')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/tours/bookings/all  (admin)
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await TourBooking.find()
      .populate('userId', 'name email')
      .populate('packageId', 'name')
      .populate('guideId', 'name image phone')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/tours/bookings/:id/status  (admin)
exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const VALID_STATUSES = ['pending', 'confirmed', 'rejected', 'cancelled'];
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ message: `status must be one of: ${VALID_STATUSES.join(', ')}.` });
    }
    const booking = await TourBooking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    res.json(booking);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PUT /api/tours/bookings/:id/cancel  (user)
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await TourBooking.findOne({ _id: req.params.id, userId: req.user._id });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.status !== 'pending')
      return res.status(400).json({ message: 'Only pending bookings can be cancelled.' });
    booking.status = 'cancelled';
    await booking.save();
    res.json(booking);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
