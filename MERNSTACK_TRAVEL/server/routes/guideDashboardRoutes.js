const express = require('express');
const router = express.Router();
const { protect, guideOnly } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');
const {
  getMyGuideProfile,
  updateMyGuideProfile,
  getMyBookingRequests,
  acceptBookingRequest,
  rejectBookingRequest,
  getMySchedule
} = require('../controllers/guideDashboardController');

router.use(protect, guideOnly);

router.get('/profile', getMyGuideProfile);
router.put('/profile', upload.single('image'), updateMyGuideProfile);
router.get('/bookings', getMyBookingRequests);
router.put('/bookings/:id/accept', acceptBookingRequest);
router.put('/bookings/:id/reject', rejectBookingRequest);
router.get('/schedule', getMySchedule);

module.exports = router;
