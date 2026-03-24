const express = require('express');
const router = express.Router();
const {
  getPackages,
  getPackage,
  createPackage,
  updatePackage,
  deletePackage,
  calculatePrice,
  createBooking,
  getMyBookings,
  getAllBookings,
  updateBookingStatus,
  cancelBooking,
} = require('../controllers/tourController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');

// Price preview (public — must be before /:id)
router.post('/calculate-price', calculatePrice);

// Bookings (must be before /:id to avoid conflicts)
router.post('/bookings', protect, upload.single('slip'), createBooking);
router.get('/bookings/my', protect, getMyBookings);
router.get('/bookings/all', protect, adminOnly, getAllBookings);
router.put('/bookings/:id/status', protect, adminOnly, updateBookingStatus);
router.put('/bookings/:id/cancel', protect, cancelBooking);

// Packages
router.get('/', getPackages);
router.get('/:id', getPackage);
router.post('/', protect, adminOnly, upload.array('images', 8), createPackage);
router.put('/:id', protect, adminOnly, upload.array('images', 8), updatePackage);
router.delete('/:id', protect, adminOnly, deletePackage);

module.exports = router;
