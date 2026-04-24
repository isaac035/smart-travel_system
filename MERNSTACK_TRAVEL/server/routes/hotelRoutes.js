const express = require('express');
const router = express.Router();
const {
  getHotels, getHotel, createHotel, updateHotel, deleteHotel, addReview,
  createBooking, getMyBookings, getAllBookings, updateBookingStatus,
  getDestinationCounts,
} = require('../controllers/hotelController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');

// ─── Hotel routes ───────────────────────────
router.get('/', getHotels);
router.get('/destination-counts', getDestinationCounts);
router.get('/:id', getHotel);
router.post(
  '/',
  protect,
  (req, res, next) =>
    (req.user.role === 'admin' || req.user.role === 'hotelOwner')
      ? next()
      : res.status(403).json({ message: 'Access denied' }),
  upload.fields([
    // Existing admin/owner form uses `images` for hotel images
    { name: 'images', maxCount: 20 },
    // New: one uploaded room image per room (order matches rooms array)
    { name: 'roomImages', maxCount: 200 },
  ]),
  createHotel
);
router.put('/:id', protect, adminOnly, upload.array('images', 20), updateHotel);
router.delete('/:id', protect, adminOnly, deleteHotel);
router.post('/:id/reviews', protect, addReview);

// ─── Booking routes ──────────────────────────
router.post('/bookings/create', protect, createBooking);
router.get('/bookings/my', protect, getMyBookings);
router.get('/bookings/all', protect, adminOnly, getAllBookings);
router.put('/bookings/:id/status', protect, updateBookingStatus);

module.exports = router;
