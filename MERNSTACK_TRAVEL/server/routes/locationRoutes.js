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


// Geocode proxy — uses Photon API (OSM data, no rate limits)
router.get('/geocode', async (req, res) => {
  try {
    const q = req.query.q;
    if (!q || q.trim().length < 2) return res.json([]);
    // Photon API: biased toward Sri Lanka center (7.87, 80.77)
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&lang=en&limit=12&lat=7.87&lon=80.77`;
    const resp = await fetch(url);
    if (!resp.ok) return res.json([]);
    const data = await resp.json();
    // Filter to Sri Lanka only and convert to Nominatim-like format
    const results = data.features
      .filter(f => f.properties.countrycode === 'LK')
      .slice(0, 8)
      .map(f => {
        const p = f.properties;
        const [lon, lat] = f.geometry.coordinates;
        return {
          display_name: [p.name, p.county, p.state, p.country].filter(Boolean).join(', '),
          lat: String(lat),
          lon: String(lon),
          address: {
            state_district: p.county || '',
            state: p.state || '',
            city: p.city || '',
            town: p.town || '',
            village: p.village || '',
            county: p.county || '',
          },
        };
      });
    res.json(results);
  } catch {
    res.json([]);
  }
});

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
