const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile, guideRegister, guideLogin } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Guide auth routes
router.post('/guide/register', guideRegister);
router.post('/guide/login', guideLogin);

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, upload.fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'coverPhoto', maxCount: 1 },
]), updateProfile);

module.exports = router;
