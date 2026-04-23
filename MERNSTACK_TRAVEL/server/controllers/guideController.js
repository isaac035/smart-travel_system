const Guide = require('../models/Guide');
const GuideBooking = require('../models/GuideBooking');
const { checkDateConflicts, getGuideSchedule } = require('../utils/dateConflict');

// ─── GUIDES ───────────────────────────────────────────────────

const getGuides = async (req, res) => {
  try {
    const filter = {};
    if (req.query.location) filter.location = { $regex: req.query.location, $options: 'i' };
    if (req.query.language) filter.languages = { $in: [new RegExp(req.query.language, 'i')] };
    if (req.query.rating) filter.rating = { $gte: Number(req.query.rating) };
    if (req.query.minPrice) filter.pricePerDay = { $gte: Number(req.query.minPrice) };
    if (req.query.maxPrice) filter.pricePerDay = { ...filter.pricePerDay, $lte: Number(req.query.maxPrice) };
    if (req.query.available === 'true') filter.isAvailable = true;
    

    const guides = await Guide.find(filter).sort({ rating: -1 });
    res.json(guides);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getGuide = async (req, res) => {
  try {
    const guide = await Guide.findById(req.params.id);
    if (!guide) return res.status(404).json({ message: 'Guide not found' });
    res.json(guide);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getGuideReviews = async (req, res) => {
  try {
    const bookings = await GuideBooking.find({
      guideId: req.params.id,
      'review.comment': { $exists: true },
    }).select('review travelerName createdAt').sort({ createdAt: -1 });

    const reviews = bookings.map((b) => ({
      ...b.review.toObject(),
      travelerName: b.travelerName,
      bookingDate: b.createdAt,
    }));
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createGuide = async (req, res) => {
  try {
    let languages = req.body.languages;
    if (typeof languages === 'string') languages = JSON.parse(languages);
    let services = req.body.services;
    if (typeof services === 'string') services = JSON.parse(services);
    let certifications = req.body.certifications;
    if (typeof certifications === 'string') certifications = JSON.parse(certifications);

    const image = req.file ? req.file.path : '';
    const guide = await Guide.create({
      ...req.body,
      image,
      languages: languages || [],
      services: services || [],
      certifications: certifications || [],
    });
    res.status(201).json(guide);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateGuide = async (req, res) => {
  try {
    const updates = { ...req.body };
    if (typeof updates.languages === 'string') updates.languages = JSON.parse(updates.languages);
    if (typeof updates.services === 'string') updates.services = JSON.parse(updates.services);
    if (typeof updates.certifications === 'string') updates.certifications = JSON.parse(updates.certifications);
    if (req.file) updates.image = req.file.path;
    else if (updates.existingImage === '') updates.image = '';
    delete updates.existingImage;

    const guide = await Guide.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!guide) return res.status(404).json({ message: 'Guide not found' });
    res.json(guide);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteGuide = async (req, res) => {
  try {
    await Guide.findByIdAndDelete(req.params.id);
    res.json({ message: 'Guide deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── BOOKINGS ─────────────────────────────────────────────────

const createBooking = async (req, res) => {
  try {
    const { travelerName, email, phone, startDate, days, travelers, location, specialRequests } = req.body;

    const guideId = req.body.guideId || req.params.guideId;
    const guide = await Guide.findById(guideId);
    if (!guide) return res.status(404).json({ message: 'Guide not found' });

    if (!req.file) {
      return res.status(400).json({ message: 'Please upload your deposit payment slip' });
    }

    const dailyRate = Number(guide.pricePerDay) || 0;
    const numDays = Math.max(1, Number(days) || 1);
    const totalPrice = (dailyRate * numDays) || 0;
    const depositPercentage = 30;
    const depositAmount = Math.round(totalPrice * depositPercentage / 100) || 0;
    const remainingAmount = (totalPrice - depositAmount) || 0;

    // Calculate endDate from startDate + days
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + numDays - 1);

    const booking = await GuideBooking.create({
      guideId: guide._id,
      userId: req.user._id,
      travelerName,
      email,
      phone,
      startDate: start,
      endDate: end,
      travelDate: start,
      days: numDays,
      travelers: Number(travelers) || 1,
      location,
      specialRequests,
      totalPrice,
      depositPercentage,
      depositAmount,
      remainingAmount,
      depositSlip: req.file.path,
      status: 'deposit_submitted',
      guideDecision: { status: 'pending' },
      adminDecision: { depositVerified: false, remainingVerified: false }
    });

    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMyBookings = async (req, res) => {
  try {
    const bookings = await GuideBooking.find({ userId: req.user._id })
      .populate('guideId', 'name image location pricePerDay')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllBookings = async (req, res) => {
  try {
    const bookings = await GuideBooking.find()
      .populate('guideId', 'name image location pricePerDay')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const cancelBooking = async (req, res) => {
  try {
    const booking = await GuideBooking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const nonCancellable = ['completed', 'fully_paid', 'cancelled_by_user', 'cancelled_by_admin', 'refunded', 'partially_refunded', 'no_refund'];
    if (nonCancellable.includes(booking.status)) {
      return res.status(400).json({ message: 'This booking cannot be cancelled' });
    }

    // Calculate refund eligibility
    const now = new Date();
    const tripStart = new Date(booking.startDate);
    const daysUntilTrip = Math.ceil((tripStart - now) / (1000 * 60 * 60 * 24));

    let refundEligibility = 'none';
    let refundAmount = 0;

    if (daysUntilTrip >= 3) {
      refundEligibility = 'full';
      refundAmount = booking.depositAmount;
    } else if (daysUntilTrip >= 1) {
      refundEligibility = 'partial';
      refundAmount = Math.round(booking.depositAmount * 0.5);
    }

    booking.status = 'cancelled_by_user';
    booking.cancellation = {
      cancelledBy: 'user',
      cancelledAt: new Date(),
      reason: req.body?.reason || '',
      refundEligibility,
      refundAmount,
      refundStatus: refundAmount > 0 ? 'pending' : 'none'
    };

    await booking.save();
    res.json({
      message: 'Booking cancelled',
      refundEligibility,
      refundAmount,
      booking
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addReview = async (req, res) => {
  try {
    const booking = await GuideBooking.findOne({ _id: req.params.id, userId: req.user._id });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.status !== 'completed') return res.status(400).json({ message: 'Can only review completed bookings' });
    if (booking.review?.comment) return res.status(400).json({ message: 'Already reviewed' });

    const { rating, comment } = req.body;
    booking.review = { userId: req.user._id, userName: req.user.name, rating: Number(rating), comment };
    await booking.save();

    // Update guide rating
    const guide = await Guide.findById(booking.guideId);
    if (guide) {
      const allReviews = await GuideBooking.find({ guideId: guide._id, 'review.comment': { $exists: true } });
      const avg = allReviews.reduce((s, b) => s + (b.review?.rating || 0), 0) / allReviews.length;
      guide.rating = Math.round(avg * 10) / 10;
      guide.reviewCount = allReviews.length;
      await guide.save();
    }

    res.json({ message: 'Review submitted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── REMAINING PAYMENT ───────────────────────────────────────

const submitRemainingPayment = async (req, res) => {
  try {
    const booking = await GuideBooking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (booking.status !== 'remaining_payment_pending') {
      return res.status(400).json({ message: 'Remaining payment is not expected at this stage' });
    }

    if (req.file) {
      booking.remainingSlip = req.file.path;
    }

    booking.status = 'remaining_payment_submitted';
    await booking.save();

    res.json({ message: 'Remaining payment submitted. Awaiting admin verification.', booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── ADMIN BOOKING MANAGEMENT ────────────────────────────────

// Admin verifies deposit slip → sends to guide for review
const verifyDeposit = async (req, res) => {
  try {
    const booking = await GuideBooking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (booking.status !== 'deposit_submitted') {
      return res.status(400).json({ message: `Cannot verify deposit for status: ${booking.status}` });
    }

    booking.status = 'pending_guide_review';
    booking.adminDecision.depositVerified = true;
    await booking.save();

    res.json({ message: 'Deposit verified. Sent to guide for review.', booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin confirms booking after guide accepted (checks date conflicts)
const adminConfirmBooking = async (req, res) => {
  try {
    const booking = await GuideBooking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (booking.status !== 'guide_accepted') {
      return res.status(400).json({ message: `Cannot confirm booking with status: ${booking.status}` });
    }

    // Check date conflicts
    const conflicts = await checkDateConflicts(booking.guideId, booking.startDate, booking.endDate, booking._id);
    if (conflicts.length > 0) {
      return res.status(409).json({
        message: 'This guide is already booked for the selected date range.',
        conflicts
      });
    }

    booking.status = 'remaining_payment_pending';
    booking.adminDecision.confirmedAt = new Date();
    await booking.save();

    res.json({ message: 'Booking confirmed. User notified to pay remaining balance.', booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin rejects booking
const adminRejectBooking = async (req, res) => {
  try {
    const booking = await GuideBooking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    booking.status = 'cancelled_by_admin';
    booking.adminDecision.rejectedAt = new Date();
    booking.adminDecision.reason = req.body.reason || '';
    booking.cancellation = {
      cancelledBy: 'admin',
      cancelledAt: new Date(),
      reason: req.body.reason || '',
      refundEligibility: 'full',
      refundAmount: booking.depositAmount,
      refundStatus: 'pending'
    };

    await booking.save();
    res.json({ message: 'Booking rejected. Deposit refund pending.', booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin verifies remaining payment → fully paid
const verifyRemainingPayment = async (req, res) => {
  try {
    const booking = await GuideBooking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (booking.status !== 'remaining_payment_submitted') {
      return res.status(400).json({ message: `Cannot verify remaining payment for status: ${booking.status}` });
    }

    booking.status = 'fully_paid';
    booking.adminDecision.remainingVerified = true;
    await booking.save();

    res.json({ message: 'Booking fully paid and confirmed.', booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin reassigns a different guide
const reassignGuide = async (req, res) => {
  try {
    const booking = await GuideBooking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const newGuide = await Guide.findById(req.body.newGuideId);
    if (!newGuide) return res.status(404).json({ message: 'New guide not found' });

    // Check conflicts for new guide
    const conflicts = await checkDateConflicts(newGuide._id, booking.startDate, booking.endDate, booking._id);
    if (conflicts.length > 0) {
      return res.status(409).json({
        message: 'The new guide is also booked for these dates.',
        conflicts
      });
    }

    // Recalculate price with new guide's rate
    const dailyRate = Number(newGuide.pricePerDay) || 0;
    const numDays = Number(booking.days) || 0;
    const depPercent = Number(booking.depositPercentage) || 30;

    booking.guideId = newGuide._id;
    booking.totalPrice = dailyRate * numDays || 0;
    booking.depositAmount = Math.round(booking.totalPrice * depPercent / 100) || 0;
    booking.remainingAmount = (booking.totalPrice - booking.depositAmount) || 0;

    // Reset to pending_guide_review so new guide can accept
    booking.status = 'pending_guide_review';
    booking.guideDecision = { status: 'pending' };

    await booking.save();
    res.json({ message: 'Guide reassigned. New guide will review the request.', booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin processes refund
const processRefund = async (req, res) => {
  try {
    const booking = await GuideBooking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const { refundStatus } = req.body;

    if (booking.cancellation.refundAmount > 0 && refundStatus === 'processed') {
      if (booking.cancellation.refundEligibility === 'full') {
        booking.status = 'refunded';
      } else if (booking.cancellation.refundEligibility === 'partial') {
        booking.status = 'partially_refunded';
      }
      booking.cancellation.refundStatus = 'processed';
    } else {
      booking.status = 'no_refund';
      booking.cancellation.refundStatus = 'none';
    }

    await booking.save();
    res.json({ message: 'Refund processed.', booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin gets guide schedule for conflict checking
const getGuideScheduleAdmin = async (req, res) => {
  try {
    const schedule = await getGuideSchedule(req.params.guideId);
    res.json(schedule);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── GUIDE APPROVAL (Admin) ─────────────────────────────────

const approveGuide = async (req, res) => {
  try {
    const guide = await Guide.findById(req.params.id);
    if (!guide) return res.status(404).json({ message: 'Guide not found' });

    guide.isApproved = true;
    guide.approvalStatus = 'approved';
    guide.isAvailable = true;
    await guide.save();

    res.json({ message: 'Guide approved successfully', guide });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const rejectGuide = async (req, res) => {
  try {
    const guide = await Guide.findById(req.params.id);
    if (!guide) return res.status(404).json({ message: 'Guide not found' });

    guide.isApproved = false;
    guide.approvalStatus = 'rejected';
    guide.rejectionReason = req.body.reason || '';
    guide.isAvailable = false;
    await guide.save();

    res.json({ message: 'Guide rejected', guide });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Keep legacy updateBookingStatus for backward compat
const updateBookingStatus = async (req, res) => {
  try {
    const booking = await GuideBooking.findByIdAndUpdate(
      req.params.id, { status: req.body.status }, { new: true }
    );
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getGuides, getGuide, getGuideReviews, createGuide, updateGuide, deleteGuide,
  createBooking, getMyBookings, getAllBookings, cancelBooking, addReview, updateBookingStatus,
  submitRemainingPayment,
  verifyDeposit, adminConfirmBooking, adminRejectBooking, verifyRemainingPayment,
  reassignGuide, processRefund, getGuideScheduleAdmin,
  approveGuide, rejectGuide,
};
