const Guide = require('../models/Guide');
const GuideBooking = require('../models/GuideBooking');

// GET /api/guide-dashboard/profile
const getMyGuideProfile = async (req, res) => {
  try {
    const guide = await Guide.findOne({ userId: req.user._id });
    if (!guide) return res.status(404).json({ message: 'Guide profile not found' });
    res.json(guide);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/guide-dashboard/profile
const updateMyGuideProfile = async (req, res) => {
  try {
    const guide = await Guide.findOne({ userId: req.user._id });
    if (!guide) return res.status(404).json({ message: 'Guide profile not found' });

    const { bio, languages, services, certifications, location, pricePerDay, isAvailable, phone } = req.body;
    if (bio !== undefined) guide.bio = bio;
    if (languages) guide.languages = typeof languages === 'string' ? JSON.parse(languages) : languages;
    if (services) guide.services = typeof services === 'string' ? JSON.parse(services) : services;
    if (certifications) guide.certifications = typeof certifications === 'string' ? JSON.parse(certifications) : certifications;
    if (location) guide.location = location;
    if (pricePerDay !== undefined) guide.pricePerDay = pricePerDay;
    if (isAvailable !== undefined) guide.isAvailable = isAvailable;
    if (phone) guide.phone = phone;

    if (req.file) guide.image = req.file.path;

    await guide.save();
    res.json(guide);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/guide-dashboard/bookings
const getMyBookingRequests = async (req, res) => {
  try {
    const guide = await Guide.findOne({ userId: req.user._id });
    if (!guide) return res.status(404).json({ message: 'Guide profile not found' });

    const bookings = await GuideBooking.find({ guideId: guide._id })
      .populate('userId', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/guide-dashboard/bookings/:id/accept
const acceptBookingRequest = async (req, res) => {
  try {
    const guide = await Guide.findOne({ userId: req.user._id });
    if (!guide) return res.status(404).json({ message: 'Guide profile not found' });

    const booking = await GuideBooking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.guideId.toString() !== guide._id.toString()) {
      return res.status(403).json({ message: 'This booking is not assigned to you' });
    }

    if (booking.status !== 'pending_guide_review') {
      return res.status(400).json({ message: `Cannot accept booking with status: ${booking.status}` });
    }

    booking.status = 'guide_accepted';
    booking.guideDecision = {
      status: 'accepted',
      decidedAt: new Date()
    };

    await booking.save();
    res.json({ message: 'Booking request accepted. Forwarded to admin for review.', booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/guide-dashboard/bookings/:id/reject
const rejectBookingRequest = async (req, res) => {
  try {
    const guide = await Guide.findOne({ userId: req.user._id });
    if (!guide) return res.status(404).json({ message: 'Guide profile not found' });

    const booking = await GuideBooking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.guideId.toString() !== guide._id.toString()) {
      return res.status(403).json({ message: 'This booking is not assigned to you' });
    }

    if (booking.status !== 'pending_guide_review') {
      return res.status(400).json({ message: `Cannot reject booking with status: ${booking.status}` });
    }

    booking.status = 'guide_rejected';
    booking.guideDecision = {
      status: 'rejected',
      decidedAt: new Date(),
      reason: req.body.reason || ''
    };

    await booking.save();
    res.json({ message: 'Booking request rejected.', booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/guide-dashboard/schedule
const getMySchedule = async (req, res) => {
  try {
    const guide = await Guide.findOne({ userId: req.user._id });
    if (!guide) return res.status(404).json({ message: 'Guide profile not found' });

    const activeStatuses = [
      'guide_accepted', 'under_admin_review', 'admin_confirmed',
      'remaining_payment_pending', 'remaining_payment_submitted', 'fully_paid', 'completed'
    ];

    const bookings = await GuideBooking.find({
      guideId: guide._id,
      status: { $in: activeStatuses }
    }).select('startDate endDate status travelerName location').sort({ startDate: 1 });

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getMyGuideProfile,
  updateMyGuideProfile,
  getMyBookingRequests,
  acceptBookingRequest,
  rejectBookingRequest,
  getMySchedule
};
