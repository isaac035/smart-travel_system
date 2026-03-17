const express = require('express');
const router = express.Router();
const axios = require('axios');

const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// @route GET /api/weather?city=Colombo
router.get('/', async (req, res) => {
  try {
    const city = req.query.city || 'Colombo';
    const { data } = await axios.get(`${BASE_URL}/weather`, {
      params: { q: city, appid: process.env.WEATHER_API_KEY, units: 'metric' },
    });
    res.json(data);
  } catch (error) {
    const status = error.response?.status || 500;
    const message = status === 404 ? 'City not found' : 'Weather service unavailable';
    res.status(status).json({ message });
  }
});

// @route GET /api/weather/coords?lat=6.9271&lng=79.8612
router.get('/coords', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) return res.status(400).json({ message: 'lat and lng are required' });
    const { data } = await axios.get(`${BASE_URL}/weather`, {
      params: { lat, lon: lng, appid: process.env.WEATHER_API_KEY, units: 'metric' },
    });
    res.json(data);
  } catch (error) {
    const status = error.response?.status || 500;
    res.status(status).json({ message: 'Weather service unavailable' });
  }
});

// @route GET /api/weather/coords/forecast?lat=6.9271&lng=79.8612
router.get('/coords/forecast', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) return res.status(400).json({ message: 'lat and lng are required' });
    const { data } = await axios.get(`${BASE_URL}/forecast`, {
      params: { lat, lon: lng, appid: process.env.WEATHER_API_KEY, units: 'metric', cnt: 40 },
    });
    res.json(data);
  } catch (error) {
    const status = error.response?.status || 500;
    res.status(status).json({ message: 'Weather service unavailable' });
  }
});

// @route GET /api/weather/forecast?city=Colombo
router.get('/forecast', async (req, res) => {
  try {
    const city = req.query.city || 'Colombo';
    const { data } = await axios.get(`${BASE_URL}/forecast`, {
      params: { q: city, appid: process.env.WEATHER_API_KEY, units: 'metric', cnt: 40 },
    });
    res.json(data);
  } catch (error) {
    const status = error.response?.status || 500;
    const message = status === 404 ? 'City not found' : 'Weather service unavailable';
    res.status(status).json({ message });
  }
});

module.exports = router;
