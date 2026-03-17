const axios = require('axios');

const ORS_BASE = 'https://api.openrouteservice.org';

// POST /api/routes/matrix
// Body: { locations: [[lng, lat], [lng, lat], ...] }
exports.getMatrix = async (req, res) => {
  try {
    const { locations } = req.body;
    if (!locations || locations.length < 2) {
      return res.status(400).json({ message: 'At least 2 locations required' });
    }
    const response = await axios.post(
      `${ORS_BASE}/v2/matrix/driving-car`,
      { locations, metrics: ['distance', 'duration'] },
      {
        headers: {
          Authorization: process.env.ORS_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    res.json(response.data);
  } catch (err) {
    const status = err.response?.status || 500;
    const message = err.response?.data?.error?.message || err.message;
    res.status(status).json({ message });
  }
};

// POST /api/routes/directions
// Body: { coordinates: [[lng, lat], [lng, lat], ...] }
exports.getDirections = async (req, res) => {
  try {
    const { coordinates } = req.body;
    if (!coordinates || coordinates.length < 2) {
      return res.status(400).json({ message: 'At least 2 coordinates required' });
    }
    const response = await axios.post(
      `${ORS_BASE}/v2/directions/driving-car/geojson`,
      { coordinates },
      {
        headers: {
          Authorization: process.env.ORS_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    res.json(response.data);
  } catch (err) {
    const status = err.response?.status || 500;
    const message = err.response?.data?.error?.message || err.message;
    res.status(status).json({ message });
  }
};
