const TourPackage = require('../models/TourPackage');
const TourBooking = require('../models/TourBooking');
const { upload } = require('../config/cloudinary');

// ── Package CRUD ──────────────────────────────────────────────────

// GET /api/tours
exports.getPackages = async (req, res) => {
  try {
    const packages = await TourPackage.find({ isActive: true })
      .populate('locations', 'name district province')
      .populate('guideIds', 'name avatar rating');
    res.json(packages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/tours/:id
exports.getPackage = async (req, res) => {
  try {
    const pkg = await TourPackage.findById(req.params.id)
      .populate('locations', 'name district province category coordinates images')
      .populate('guideIds', 'name avatar rating languages pricePerDay');
    if (!pkg) return res.status(404).json({ message: 'Package not found' });
    res.json(pkg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/tours  (admin)
exports.createPackage = async (req, res) => {
  try {
    const images = req.files ? req.files.map((f) => f.path) : [];
    const body = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body;
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
    const { packageId, vehicle, travelers, startDate, notes } = req.body;
    const pkg = await TourPackage.findById(packageId);
    if (!pkg) return res.status(404).json({ message: 'Package not found' });

    const multiplier = pkg.vehicleMultipliers[vehicle] || 1;
    const totalPrice = pkg.basePrice * multiplier * travelers;

    const slipUrl = req.file ? req.file.path : undefined;

    const booking = await TourBooking.create({
      userId: req.user._id,
      packageId,
      vehicle,
      travelers,
      startDate,
      totalPrice,
      slipUrl,
      notes,
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
      return res.status(400).json({ message: 'Only pending bookings can be cancelled' });
    booking.status = 'cancelled';
    await booking.save();
    res.json(booking);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
