const express = require('express');
const router = express.Router();
const { protect, hotelOwnerOnly } = require('../middleware/authMiddleware');
const {
  getOwnerHotels,
  getOwnerStats,
  getOwnerBookings,
  acceptBooking,
  rejectBooking,
} = require('../controllers/hotelOwnerDashboardController');

router.use(protect, hotelOwnerOnly);

router.get('/hotels', getOwnerHotels);
router.get('/stats', getOwnerStats);
router.get('/bookings', getOwnerBookings);

router.put('/bookings/:id/accept', acceptBooking);
router.put('/bookings/:id/reject', rejectBooking);

module.exports = router;

