const User = require('../models/User');
const bcrypt = require('bcryptjs');
const Location = require('../models/Location');
const Hotel = require('../models/Hotel');
const HotelBooking = require('../models/HotelBooking');
const Guide = require('../models/Guide');
const GuideBooking = require('../models/GuideBooking');
const TourPackage = require('../models/TourPackage');
const TourBooking = require('../models/TourBooking');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const ProductOrder = require('../models/ProductOrder');
const SupportRequest = require('../models/SupportRequest');


// GET /api/admin/users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 }).lean();

    // Enrich guide users with their Guide profile data
    const guideUsers = users.filter(u => u.role === 'guide');
    if (guideUsers.length > 0) {
      const guideProfiles = await Guide.find({
        userId: { $in: guideUsers.map(u => u._id) }
      }).select('userId approvalStatus rejectionReason location languages experience isAvailable pricePerDay').lean();

      const guideMap = {};
      guideProfiles.forEach(g => { guideMap[g.userId.toString()] = g; });

      users.forEach(u => {
        if (u.role === 'guide' && guideMap[u._id.toString()]) {
          u.guideProfile = guideMap[u._id.toString()];
        }
      });
    }

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/admin/users/:id
exports.updateUser = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email) return res.status(400).json({ message: 'Name and email are required' });
    const existing = await User.findOne({ email, _id: { $ne: req.params.id } });
    if (existing) return res.status(400).json({ message: 'Email already in use by another user' });

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.name = name;
    user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (password && password.trim()) {
      user.password = password; // will be hashed by pre-save hook
    }

    await user.save();
    const updated = await User.findById(user._id).select('-password');
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PUT /api/admin/users/:id/role
exports.updateUserRole = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { role: req.body.role }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE /api/admin/users/:id
exports.deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) return res.status(400).json({ message: 'Cannot delete yourself' });
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/admin/users/:id/promote-guide
exports.promoteToGuide = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'guide') return res.status(400).json({ message: 'User is already a guide' });

    user.role = 'guide';
    await user.save();

    // Create linked Guide profile
    const existing = await Guide.findOne({ userId: user._id });
    if (!existing) {
      await Guide.create({
        userId: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        location: req.body.location || 'Not set',
        pricePerDay: 0,
        isApproved: true,
        approvalStatus: 'approved',
        isAvailable: true
      });
    }

    const updated = await User.findById(user._id).select('-password').lean();
    const guideProfile = await Guide.findOne({ userId: user._id })
      .select('userId approvalStatus rejectionReason location languages experience isAvailable pricePerDay').lean();
    if (guideProfile) updated.guideProfile = guideProfile;

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/users/:id/guide-bookings
exports.getGuideBookings = async (req, res) => {
  try {
    const guide = await Guide.findOne({ userId: req.params.id });
    if (!guide) return res.status(404).json({ message: 'Guide profile not found' });

    const bookings = await GuideBooking.find({ guideId: guide._id })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/stats
exports.getStats = async (req, res) => {
  try {
    const [users, locations, hotels, guides, tourPackages, hotelBookings, guideBookings, tourBookings, productOrders, products] =
      await Promise.all([
        User.countDocuments(),
        Location.countDocuments(),
        Hotel.countDocuments(),
        Guide.countDocuments(),
        TourPackage.countDocuments(),
        HotelBooking.countDocuments(),
        GuideBooking.countDocuments(),
        TourBooking.countDocuments(),
        ProductOrder.countDocuments(),
        Product.countDocuments(),
      ]);

    // Real revenue from all booking types
    const [hotelRevenue, guideRevenue, tourRevenue, productRevenue] = await Promise.all([
      HotelBooking.aggregate([{ $group: { _id: null, total: { $sum: '$totalPrice' } } }]),
      GuideBooking.aggregate([{ $group: { _id: null, total: { $sum: '$totalPrice' } } }]),
      TourBooking.aggregate([{ $group: { _id: null, total: { $sum: '$totalPrice' } } }]),
      ProductOrder.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
    ]);
    const totalRevenue =
      (hotelRevenue[0]?.total || 0) +
      (guideRevenue[0]?.total || 0) +
      (tourRevenue[0]?.total || 0) +
      (productRevenue[0]?.total || 0);

    // Monthly revenue breakdown (current year)
    const year = new Date().getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const [hotelMonthly, guideMonthly, tourMonthly, productMonthly] = await Promise.all([
      HotelBooking.aggregate([
        { $match: { createdAt: { $gte: startOfYear } } },
        { $group: { _id: { $month: '$createdAt' }, total: { $sum: '$totalPrice' } } },
      ]),
      GuideBooking.aggregate([
        { $match: { createdAt: { $gte: startOfYear } } },
        { $group: { _id: { $month: '$createdAt' }, total: { $sum: '$totalPrice' } } },
      ]),
      TourBooking.aggregate([
        { $match: { createdAt: { $gte: startOfYear } } },
        { $group: { _id: { $month: '$createdAt' }, total: { $sum: '$totalPrice' } } },
      ]),
      ProductOrder.aggregate([
        { $match: { createdAt: { $gte: startOfYear } } },
        { $group: { _id: { $month: '$createdAt' }, total: { $sum: '$amount' } } },
      ]),
    ]);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const monthlyRevenue = months.map((m, i) => {
      const mo = i + 1;
      const h = hotelMonthly.find(x => x._id === mo)?.total || 0;
      const g = guideMonthly.find(x => x._id === mo)?.total || 0;
      const t = tourMonthly.find(x => x._id === mo)?.total || 0;
      const p = productMonthly.find(x => x._id === mo)?.total || 0;
      return { month: m, revenue: h + g + t + p };
    });

    // Popular destinations — locations that appear most in tour packages
    const popularLocations = await TourBooking.aggregate([
      { $lookup: { from: 'tourpackages', localField: 'packageId', foreignField: '_id', as: 'pkg' } },
      { $unwind: '$pkg' },
      { $unwind: '$pkg.locations' },
      { $group: { _id: '$pkg.locations', bookings: { $sum: 1 } } },
      { $sort: { bookings: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'locations', localField: '_id', foreignField: '_id', as: 'loc' } },
      { $unwind: '$loc' },
      { $project: { name: '$loc.name', district: '$loc.district', province: '$loc.province', bookings: 1 } },
    ]);

    // If no tour bookings, fall back to locations sorted by creation
    let popularDestinations = popularLocations;
    if (popularDestinations.length === 0) {
      const locs = await Location.find().sort({ createdAt: -1 }).limit(5).select('name district province').lean();
      popularDestinations = locs.map(l => ({ name: l.name, district: l.district, province: l.province, bookings: 0 }));
    }

    // Recent activity — latest real events from the database
    const [latestHotel, latestGuide, latestTour, latestProduct, latestUsers] = await Promise.all([
      HotelBooking.find().sort({ createdAt: -1 }).limit(3).populate('userId', 'name').populate('hotelId', 'name').lean(),
      GuideBooking.find().sort({ createdAt: -1 }).limit(3).populate('userId', 'name').populate('guideId', 'name').lean(),
      TourBooking.find().sort({ createdAt: -1 }).limit(3).populate('userId', 'name').populate('packageId', 'name').lean(),
      ProductOrder.find().sort({ createdAt: -1 }).limit(3).populate('userId', 'name').lean(),
      User.find().sort({ createdAt: -1 }).limit(3).select('name createdAt').lean(),
    ]);
    const recentActivity = [
      ...latestHotel.map(b => ({
        text: `Hotel booking — ${b.hotelId?.name || 'Hotel'}`,
        sub: b.userId?.name || 'User',
        type: 'hotel',
        createdAt: b.createdAt,
      })),
      ...latestGuide.map(b => ({
        text: `Guide booking — ${b.guideId?.name || 'Guide'}`,
        sub: b.userId?.name || 'User',
        type: 'guide',
        createdAt: b.createdAt,
      })),
      ...latestTour.map(b => ({
        text: `Tour booking — ${b.packageId?.name || 'Tour Package'}`,
        sub: b.userId?.name || 'User',
        type: 'tour',
        createdAt: b.createdAt,
      })),
      ...latestProduct.map(o => ({
        text: `Product order — ${o.items?.[0]?.name || 'Products'}`,
        sub: o.userId?.name || 'User',
        type: 'product',
        createdAt: o.createdAt,
      })),
      ...latestUsers.map(u => ({
        text: `New user registered — ${u.name}`,
        sub: '',
        type: 'user',
        createdAt: u.createdAt,
      })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8);

    res.json({
      users, locations, hotels, guides, tourPackages,
      hotelBookings, guideBookings, tourBookings, productOrders,
      products,
      totalRevenue,
      monthlyRevenue,
      popularDestinations,
      recentActivity,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/tour-bookings
exports.getTourBookings = async (req, res) => {
  try {
    const bookings = await TourBooking.find()
      .populate('userId', 'name email')
      .populate('packageId', 'name images')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/hotel-bookings
exports.getHotelBookings = async (req, res) => {
  try {
    const bookings = await HotelBooking.find()
      .populate('userId', 'name email')
      .populate('hotelId', 'name images')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/product-orders
exports.getProductOrders = async (req, res) => {
  try {
    const orders = await ProductOrder.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/payments  — all bookings with slips (across all types)
exports.getAllPayments = async (req, res) => {
  try {
    const [hotelBookings, guideBookings, tourBookings, productOrders] = await Promise.all([
      HotelBooking.find({ slipUrl: { $exists: true, $ne: null } })
        .populate('userId', 'name email')
        .populate('hotelId', 'name')
        .sort({ createdAt: -1 }),
      GuideBooking.find({ slipUrl: { $exists: true, $ne: null } })
        .populate('userId', 'name email')
        .populate('guideId', 'name')
        .sort({ createdAt: -1 }),
      TourBooking.find({ slipUrl: { $exists: true, $ne: null } })
        .populate('userId', 'name email')
        .populate('packageId', 'name')
        .sort({ createdAt: -1 }),
      ProductOrder.find({ slipUrl: { $exists: true, $ne: null } })
        .populate('userId', 'name email')
        .sort({ createdAt: -1 }),
    ]);

    const payments = [
      ...hotelBookings.map((b) => ({
        _id: b._id,
        type: 'hotel',
        user: b.userId,
        reference: b.hotelId?.name || 'Hotel',
        amount: b.totalPrice,
        slipUrl: b.slipUrl,
        status: b.status,
        createdAt: b.createdAt,
      })),
      ...guideBookings.map((b) => ({
        _id: b._id,
        type: 'guide',
        user: b.userId,
        reference: b.guideId?.name || 'Guide',
        amount: b.totalPrice,
        slipUrl: b.slipUrl,
        status: b.status,
        createdAt: b.createdAt,
      })),
      ...tourBookings.map((b) => ({
        _id: b._id,
        type: 'tour',
        user: b.userId,
        reference: b.packageId?.name || 'Tour Package',
        amount: b.totalPrice,
        slipUrl: b.slipUrl,
        status: b.status,
        createdAt: b.createdAt,
      })),
      ...productOrders.map((o) => ({
        _id: o._id,
        type: 'product',
        user: o.userId,
        reference: o.items.length > 0 ? o.items.map(i => i.name).join(', ') : 'Product Order',
        amount: o.amount,
        slipUrl: o.slipUrl,
        status: o.status,
        createdAt: o.createdAt,
      })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/admin/payments/:type/:id/status
exports.updatePaymentStatus = async (req, res) => {
  const { type, id } = req.params;
  const { status } = req.body;

  const modelMap = {
    hotel: HotelBooking,
    guide: GuideBooking,
    tour: TourBooking,
    product: ProductOrder,
  };

  const Model = modelMap[type];
  if (!Model) return res.status(400).json({ message: 'Invalid booking type' });

  try {
    const booking = await Model.findByIdAndUpdate(id, { status }, { new: true });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    res.json({ message: 'Status updated', status: booking.status });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE /api/admin/tour-bookings/rejected
exports.clearRejectedTourBookings = async (req, res) => {
  try {
    const result = await TourBooking.deleteMany({ status: 'rejected' });
    res.json({ message: `Cleared ${result.deletedCount} rejected booking(s).`, count: result.deletedCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/owner-hotels — all hotels submitted by hotel owners
exports.getOwnerSubmittedHotels = async (req, res) => {
  try {
    console.log('User:', req.user);
    console.log('Query params:', req.query);
    
    const { search, district, approvalStatus } = req.query;

    const filter = {
      hotelOwnerId: { $exists: true, $ne: null },
    };

    if (approvalStatus && approvalStatus !== 'all') {
      filter.approvalStatus = approvalStatus;
    }

    if (district && district.trim()) {
      filter.location = { $regex: district.trim(), $options: 'i' };
    }

    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { location: { $regex: q, $options: 'i' } },
        { address: { $regex: q, $options: 'i' } },
      ];
    }

    const hotels = await Hotel.find(filter)
      .populate('hotelOwnerId', 'name email')
      .sort({ publishedAt: -1, createdAt: -1 })
      .lean();

    console.log('Found hotels:', hotels.length);
    res.json(hotels);
  } catch (err) {
    console.error('Error in getOwnerSubmittedHotels:', err);
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/admin/owner-hotels/:id/approval
exports.updateOwnerHotelApproval = async (req, res) => {
  try {
    const { approvalStatus } = req.body;
    const valid = ['pending_approval', 'approved', 'hold'];
    if (!valid.includes(approvalStatus)) {
      return res.status(400).json({ message: 'Invalid approval status' });
    }
    const hotel = await Hotel.findByIdAndUpdate(
      req.params.id,
      { approvalStatus },
      { new: true }
    ).populate('hotelOwnerId', 'name email');
    if (!hotel) return res.status(404).json({ message: 'Hotel not found' });
    res.json(hotel);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PUT /api/admin/owner-hotels/:id — full hotel update (details + rooms)
exports.updateOwnerHotelDetails = async (req, res) => {
  try {
    const updates = req.body;
    if (typeof updates.coordinates === 'string') updates.coordinates = JSON.parse(updates.coordinates);
    if (typeof updates.rooms === 'string') updates.rooms = JSON.parse(updates.rooms);
    if (typeof updates.amenities === 'string') updates.amenities = JSON.parse(updates.amenities);

    const hotel = await Hotel.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
      .populate('hotelOwnerId', 'name email');
    if (!hotel) return res.status(404).json({ message: 'Hotel not found' });
    res.json(hotel);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// POST /api/admin/users/create-admin — Create admin user (for initial setup)
exports.createAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin user already exists. Use that account or delete it first.' });
    }
    
    const admin = await User.create({ name, email, password, role: 'admin' });
    res.status(201).json({ message: 'Admin created successfully', adminId: admin._id });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


// PUT /api/admin/users/:id/status
exports.updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'hold', 'deactivated'].includes(status)) {
      return res.status(400).json({ message: 'Status must be active, hold, or deactivated' });
    }
    // Prevent admin from changing their own status
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot change your own account status' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// GET /api/admin/users/:id
exports.getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Include guide profile if guide
    if (user.role === 'guide') {
      const guideProfile = await Guide.findOne({ userId: user._id })
        .select('userId approvalStatus rejectionReason location languages experience isAvailable pricePerDay bio services certifications').lean();
      if (guideProfile) user.guideProfile = guideProfile;
    }

    // Include hotel owner profile if hotelOwner
    if (user.role === 'hotelOwner') {
      const HotelOwner = require('../models/HotelOwner');
      const ownerProfile = await HotelOwner.findOne({ userId: user._id })
        .select('fullName phone location coordinates').lean();
      if (ownerProfile) user.hotelOwnerProfile = ownerProfile;
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/admin/users/create-admin
exports.createAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    const user = await User.create({ name, email, password, role: 'admin', status: 'active' });
    const created = await User.findById(user._id).select('-password');
    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ─── Emergency Support Management ────────────────────────────────────────────

// GET /api/admin/support
exports.getSupportRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.status = status;

    const requests = await SupportRequest.find(filter)
      .populate('userId', 'name email avatar')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/admin/support/:id
exports.updateSupportRequest = async (req, res) => {
  try {
    const { status, adminReply } = req.body;
    const VALID = ['pending', 'accepted', 'rejected'];
    if (status && !VALID.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${VALID.join(', ')}` });
    }

    const updates = {};
    if (status) updates.status = status;
    if (adminReply !== undefined) {
      updates.adminReply = adminReply.trim();
      if (adminReply.trim()) {
        updates.repliedAt = new Date();
        updates.repliedBy = req.user._id;
      }
    }

    const request = await SupportRequest.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    ).populate('userId', 'name email avatar');

    if (!request) return res.status(404).json({ message: 'Support request not found' });
    res.json(request);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE /api/admin/support/rejected  — clear all rejected requests
exports.clearRejectedRequests = async (req, res) => {
  try {
    const result = await SupportRequest.deleteMany({ status: 'rejected' });
    res.json({ message: `Cleared ${result.deletedCount} rejected request(s).`, count: result.deletedCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
