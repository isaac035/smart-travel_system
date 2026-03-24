const express = require('express');
const router = express.Router();
const { protect, hotelOwnerOnly } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');
const {
  getOwnerHotels,
  getOwnerStats,
  getOwnerBookings,
  acceptBooking,
  rejectBooking,
  deleteHotel,
  publishHotel,
  updateHotel,
} = require('../controllers/hotelOwnerDashboardController');

router.use(protect, hotelOwnerOnly);

router.get('/hotels', getOwnerHotels);
router.get('/stats', getOwnerStats);
router.get('/bookings', getOwnerBookings);

router.post('/hotels/:id/publish', publishHotel);
router.put('/hotels/:id', upload.fields([{ name: 'images', maxCount: 20 }, { name: 'roomImages', maxCount: 200 }]), updateHotel);
router.put('/bookings/:id/accept', acceptBooking);
router.put('/bookings/:id/reject', rejectBooking);
router.delete('/hotels/:id', deleteHotel);

module.exports = router;


