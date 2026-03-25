const express = require('express');
const router = express.Router();
const {
  getLocations,
  getLocation,
  createLocation,
  updateLocation,
  deleteLocation,
  getCategories,
} = require('../controllers/locationController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');


// Public routes
router.get('/categories', getCategories);
router.get('/', getLocations);
router.get('/:id', getLocation);

// Admin only routes
const locationUpload = upload.fields([{ name: 'images', maxCount: 10 }, { name: 'mapImage', maxCount: 1 }]);
router.post('/', protect, adminOnly, locationUpload, createLocation);
router.put('/:id', protect, adminOnly, locationUpload, updateLocation);
router.delete('/:id', protect, adminOnly, deleteLocation);

module.exports = router;
