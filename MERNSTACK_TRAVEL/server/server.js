require('dotenv').config();
const dns = require('node:dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

connectDB().catch((err) => {
  console.error('MongoDB connection failed:', err.message);
  console.error('Check: 1) Your IP is whitelisted in MongoDB Atlas  2) Internet connection is active');
  process.exit(1);
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Ceylon Travel API is running' });
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/locations', require('./routes/locationRoutes'));
app.use('/api/hotels', require('./routes/hotelRoutes'));
app.use('/api/hotel-owner-dashboard', require('./routes/hotelOwnerDashboardRoutes'));
app.use('/api', require('./routes/productRoutes'));
app.use('/api/guides', require('./routes/guideRoutes'));
app.use('/api/guide-dashboard', require('./routes/guideDashboardRoutes'));
app.use('/api/weather', require('./routes/weatherRoutes'));
app.use('/api/tours', require('./routes/tourRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/trips', require('./routes/tripRoutes'));
app.use('/api/routes', require('./routes/routeRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));

// Global error handler (catches multer/cloudinary upload errors etc.)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ message: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
