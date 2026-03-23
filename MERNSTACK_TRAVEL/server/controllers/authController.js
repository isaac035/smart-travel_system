const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Guide = require('../models/Guide');
const HotelOwner = require('../models/HotelOwner');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

const formatUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
  coverPhoto: user.coverPhoto,
  phone: user.phone,
  createdAt: user.createdAt,
});

// @route POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email and password' });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const user = await User.create({ name, email, password });

    res.status(201).json({
      token: generateToken(user._id),
      user: formatUser(user),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      token: generateToken(user._id),
      user: formatUser(user),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/auth/me
const getMe = async (req, res) => {
  res.json(formatUser(req.user));
};

// @route PUT /api/auth/profile
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (req.body.name) user.name = req.body.name;
    if (req.body.phone) user.phone = req.body.phone;
    if (req.body.password) {
      user.password = req.body.password; // will be hashed by pre-save hook
    }

    // Handle file uploads from multer
    if (req.files?.avatar?.[0]) {
      user.avatar = req.files.avatar[0].path;
    }
    if (req.files?.coverPhoto?.[0]) {
      user.coverPhoto = req.files.coverPhoto[0].path;
    }

    await user.save();
    res.json(formatUser(user));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route POST /api/auth/guide/register
const guideRegister = async (req, res) => {
  try {
    const { name, email, password, phone, languages, location, experience, bio, services, certifications } = req.body;

    if (!name || !email || !password || !location) {
      return res.status(400).json({ message: 'Name, email, password, and location are required' });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Create user with guide role
    const user = await User.create({ name, email, password, role: 'guide', phone: phone || '' });

    // Create linked Guide profile
    const guide = await Guide.create({
      name,
      email,
      phone: phone || '',
      userId: user._id,
      location,
      languages: languages || [],
      experience: experience || 1,
      bio: bio || '',
      services: services || [],
      certifications: certifications || [],
      pricePerDay: 0,
      isAvailable: false
    });

    // Do NOT return a token — guide must wait for admin approval
    res.status(201).json({
      message: 'Registration successful! Your account is pending admin approval. You will be able to log in once approved.',
      pending: true
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route POST /api/auth/guide/login
const guideLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email, role: 'guide' });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid guide credentials' });
    }

    const guide = await Guide.findOne({ userId: user._id });

    // Check approval status
    if (!guide || !guide.isApproved) {
      const status = guide?.approvalStatus || 'pending';
      if (status === 'rejected') {
        return res.status(403).json({
          message: 'Your guide registration has been rejected. Please contact support for more information.',
          approvalStatus: 'rejected',
          reason: guide.rejectionReason || ''
        });
      }
      return res.status(403).json({
        message: 'Your account is pending admin approval. Please wait for approval before logging in.',
        approvalStatus: 'pending'
      });
    }

    res.json({
      token: generateToken(user._id),
      user: formatUser(user),
      guideId: guide._id
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route POST /api/auth/hotel-owner/register
// Hotel owner registers; can sign in after successful registration.
const hotelOwnerRegister = async (req, res) => {
  try {
    const { fullName, email, password, confirmPassword, phone, location, coordinates } = req.body;

    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const normalizedFullName = typeof fullName === 'string' ? fullName.trim() : '';
    const normalizedPhone = typeof phone === 'string' ? phone.trim() : '';
    const normalizedLocation = typeof location === 'string' ? location.trim() : '';

    if (!normalizedFullName || !normalizedEmail || !password || !confirmPassword || !normalizedPhone || !normalizedLocation) {
      return res.status(400).json({ message: 'Full name, email, password, confirm password, phone and location are required' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Password and confirm password do not match' });
    }

    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    const user = await User.create({
      name: normalizedFullName,
      email: normalizedEmail,
      password,
      role: 'hotelOwner',
      phone: normalizedPhone || '',
    });

    let parsedCoordinates = coordinates;
    if (typeof coordinates === 'string') {
      try {
        parsedCoordinates = JSON.parse(coordinates);
      } catch {
        parsedCoordinates = undefined;
      }
    }

    await HotelOwner.create({
      userId: user._id,
      fullName: normalizedFullName,
      phone: normalizedPhone || '',
      location: normalizedLocation,
      coordinates: parsedCoordinates && typeof parsedCoordinates === 'object' ? parsedCoordinates : undefined,
    });

    // Automatically log in the hotel owner after successful registration
    res.status(201).json({
      message: 'Hotel owner registered successfully!',
      token: generateToken(user._id),
      user: formatUser(user),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route POST /api/auth/hotel-owner/login
// Uses the same auth model as /auth/login but enforces hotelOwner role.
const hotelOwnerLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email, role: 'hotelOwner' });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid hotel owner credentials' });
    }

    // Ensure profile exists
    await HotelOwner.findOne({ userId: user._id });

    res.json({
      token: generateToken(user._id),
      user: formatUser(user),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  guideRegister,
  guideLogin,
  hotelOwnerRegister,
  hotelOwnerLogin,
};
