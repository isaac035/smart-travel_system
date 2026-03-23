const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateProfile,
  guideRegister,
  guideLogin,
  hotelOwnerRegister,
  hotelOwnerLogin,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Guide auth routes
router.post('/guide/register', guideRegister);
router.post('/guide/login', guideLogin);

// Hotel owner auth routes
router.post('/hotel-owner/register', hotelOwnerRegister);
router.post('/hotel-owner/login', hotelOwnerLogin);

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, upload.fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'coverPhoto', maxCount: 1 },
]), updateProfile);

module.exports = router;
