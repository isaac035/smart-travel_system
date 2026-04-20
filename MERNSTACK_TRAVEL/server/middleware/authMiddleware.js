const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ message: 'User not found' });
    }
    if (decoded.role && decoded.role !== req.user.role) {
      return res.status(401).json({ message: 'User role changed, please log in again' });
    }

    // Check account status
    if (req.user.status === 'hold') {
      return res.status(403).json({ message: 'Your account is currently on hold. Please contact the administrator.', accountStatus: 'hold' });
    }
    if (req.user.status === 'deactivated') {
      return res.status(403).json({ message: 'Your account has been deactivated. Please contact the administrator.', accountStatus: 'deactivated' });
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token invalid' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ message: 'Access denied: Admins only' });
};

const guideOnly = (req, res, next) => {
  if (req.user && req.user.role === 'guide') {
    return next();
  }
  return res.status(403).json({ message: 'Access denied: Guides only' });
};

const guideOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'guide' || req.user.role === 'admin')) {
    return next();
  }
  return res.status(403).json({ message: 'Access denied: Guide or Admin only' });
};

const hotelOwnerOnly = (req, res, next) => {
  if (req.user && req.user.role === 'hotelOwner') return next();
  return res.status(403).json({ message: 'Access denied: Hotel owners only' });
};

module.exports = { protect, adminOnly, guideOnly, guideOrAdmin, hotelOwnerOnly };
