const express = require('express');
const router = express.Router();
const {
  getGuides, getGuide, getGuideReviews, createGuide, updateGuide, deleteGuide,
  createBooking, getMyBookings, getAllBookings, cancelBooking, addReview, updateBookingStatus,
  submitRemainingPayment,
  verifyDeposit, adminConfirmBooking, adminRejectBooking, verifyRemainingPayment,
  reassignGuide, processRefund, getGuideScheduleAdmin,
  approveGuide, rejectGuide,
} = require('../controllers/guideController');
const { protect, adminOnly, guideOrAdmin } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');

// ─── Bookings (User) — MUST come before /:id routes ────────
router.post('/bookings/create', protect, upload.single('depositSlip'), createBooking);
router.get('/bookings/my', protect, getMyBookings);
router.put('/bookings/:id/cancel', protect, cancelBooking);
router.post('/bookings/:id/review', protect, addReview);
router.put('/bookings/:id/submit-remaining', protect, upload.single('remainingSlip'), submitRemainingPayment);

// ─── Bookings (Admin) ───────────────────────────────────────
router.get('/bookings/all', protect, adminOnly, getAllBookings);
router.put('/bookings/:id/status', protect, adminOnly, updateBookingStatus);
router.put('/bookings/:id/verify-deposit', protect, adminOnly, verifyDeposit);
router.put('/bookings/:id/admin-confirm', protect, adminOnly, adminConfirmBooking);
router.put('/bookings/:id/admin-reject', protect, adminOnly, adminRejectBooking);
router.put('/bookings/:id/verify-remaining', protect, adminOnly, verifyRemainingPayment);
router.put('/bookings/:id/reassign', protect, adminOnly, reassignGuide);
router.put('/bookings/:id/process-refund', protect, adminOnly, processRefund);


// ─── Schedule (must come before /:id) ───────────────────────
router.get('/schedule/:guideId', protect, guideOrAdmin, getGuideScheduleAdmin);

// ─── Guides (CRUD) — /:id routes LAST ──────────────────────
router.get('/', getGuides);
router.post('/', protect, adminOnly, upload.single('image'), createGuide);
router.get('/:id', getGuide);
router.get('/:id/reviews', getGuideReviews);
router.put('/:id', protect, adminOnly, upload.single('image'), updateGuide);
router.delete('/:id', protect, adminOnly, deleteGuide);

// ─── Guide Approval (Admin) ────────────────────────────────
router.put('/:id/approve', protect, adminOnly, approveGuide);
router.put('/:id/reject', protect, adminOnly, rejectGuide);

module.exports = router;
