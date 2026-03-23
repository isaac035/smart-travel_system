const User = require('../models/User');
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
    const { name, email } = req.body;
    if (!name || !email) return res.status(400).json({ message: 'Name and email are required' });
    const existing = await User.findOne({ email, _id: { $ne: req.params.id } });
    if (existing) return res.status(400).json({ message: 'Email already in use by another user' });
    const user = await User.findByIdAndUpdate(req.params.id, { name, email }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
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
    const [users, locations, hotels, guides, tourPackages, hotelBookings, guideBookings, tourBookings, productOrders] =
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
