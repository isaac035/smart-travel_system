const express = require('express');
const router = express.Router();
const {
  getHotels, getHotel, createHotel, updateHotel, deleteHotel, addReview,
  createBooking, getMyBookings, getAllBookings, updateBookingStatus,
} = require('../controllers/hotelController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');

// ─── Hotel routes ───────────────────────────
router.get('/', getHotels);
router.get('/:id', getHotel);
router.post('/', protect, adminOnly, upload.array('images', 20), createHotel);
router.put('/:id', protect, adminOnly, upload.array('images', 20), updateHotel);
router.delete('/:id', protect, adminOnly, deleteHotel);
router.post('/:id/reviews', protect, addReview);

// ─── Booking routes ──────────────────────────
router.post('/bookings/create', protect, createBooking);
router.get('/bookings/my', protect, getMyBookings);
router.get('/bookings/all', protect, adminOnly, getAllBookings);
router.put('/bookings/:id/status', protect, adminOnly, updateBookingStatus);

module.exports = router;
