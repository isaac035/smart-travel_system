const Hotel = require('../models/Hotel');
const HotelBooking = require('../models/HotelBooking');
const { upload } = require('../config/cloudinary');

const getOwnerHotels = async (req, res) => {
  try {
    const q = (req.query.search || '').toString().trim();
    const filter = { hotelOwnerId: req.user._id };

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { location: { $regex: q, $options: 'i' } },
        { address: { $regex: q, $options: 'i' } },
      ];
    }

    const hotels = await Hotel.find(filter).sort({ createdAt: -1 });
    res.json(hotels);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getOwnerStats = async (req, res) => {
  try {
    const ownerId = req.user._id;
    const hotels = await Hotel.find({ hotelOwnerId: ownerId }).select('_id');
    const hotelIds = hotels.map((h) => h._id);

    const totalHotelsUploaded = hotelIds.length;

    const pendingBookings = await HotelBooking.countDocuments({
      hotelId: { $in: hotelIds },
      status: 'pending',
    });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const revenueStatuses = ['confirmed', 'completed'];

    const [monthlyAgg, yearlyAgg] = await Promise.all([
      HotelBooking.aggregate([
        { $match: { hotelId: { $in: hotelIds }, status: { $in: revenueStatuses }, createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]),
      HotelBooking.aggregate([
        { $match: { hotelId: { $in: hotelIds }, status: { $in: revenueStatuses }, createdAt: { $gte: startOfYear } } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]),
    ]);

    res.json({
      totalHotelsUploaded,
      monthlyRevenue: monthlyAgg?.[0]?.total || 0,
      yearlyRevenue: yearlyAgg?.[0]?.total || 0,
      pendingBookings,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getOwnerBookings = async (req, res) => {
  try {
    const ownerId = req.user._id;
    const q = (req.query.search || '').toString().trim().toLowerCase();
    const hotelIdFilter = req.query.hotelId;

    const hotels = await Hotel.find({ hotelOwnerId: ownerId }).select('_id');
    const hotelIds = hotels.map((h) => h._id);

    const filter = {
      hotelId: { $in: hotelIds },
    };

    if (hotelIdFilter) {
      filter.hotelId = hotelIdFilter;
    }

    let bookings = await HotelBooking.find(filter)
      .populate('hotelId', 'name images location address coordinates starRating')
      .populate('userId', 'name email avatar')
      .sort({ createdAt: -1 });

    if (q) {
      bookings = bookings.filter((b) => {
        const guestName = `${b.firstName || ''} ${b.lastName || ''}`.trim().toLowerCase();
        const hotelName = (b.hotelId?.name || '').toLowerCase();
        const roomType = (b.roomType || '').toLowerCase();
        return guestName.includes(q) || hotelName.includes(q) || roomType.includes(q);
      });
    }

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const acceptBooking = async (req, res) => {
  try {
    const booking = await HotelBooking.findById(req.params.id).populate('hotelId', 'hotelOwnerId');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.hotelId?.hotelOwnerId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    booking.status = 'confirmed';
    await booking.save();
    res.json({ message: 'Booking accepted', booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const rejectBooking = async (req, res) => {
  try {
    const booking = await HotelBooking.findById(req.params.id).populate('hotelId', 'hotelOwnerId');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.hotelId?.hotelOwnerId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    booking.status = 'rejected';
    await booking.save();
    res.json({ message: 'Booking rejected', booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findOne({ _id: req.params.id, hotelOwnerId: req.user._id });
    if (!hotel) return res.status(404).json({ message: 'Hotel not found' });
    
    // Delete all associated bookings
    await HotelBooking.deleteMany({ hotelId: req.params.id });
    
    // Delete the hotel
    await hotel.deleteOne();
    res.json({ message: 'Hotel deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /hotel-owner-dashboard/hotels/:id/publish
const publishHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findOne({ _id: req.params.id, hotelOwnerId: req.user._id });
    if (!hotel) return res.status(404).json({ message: 'Hotel not found or access denied' });

    hotel.approvalStatus = 'pending_approval';
    hotel.publishedAt = new Date();
    await hotel.save();

    res.json({ message: 'Hotel submitted for approval', hotel });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /hotel-owner-dashboard/hotels/:id
const updateHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findOne({ _id: req.params.id, hotelOwnerId: req.user._id });
    if (!hotel) return res.status(404).json({ message: 'Hotel not found or access denied' });

    // Parse body — supports both multipart (with images) and plain JSON
    const body = req.body.data ? JSON.parse(req.body.data) : req.body;

    if (typeof body.coordinates === 'string') body.coordinates = JSON.parse(body.coordinates);
    if (typeof body.rooms === 'string') body.rooms = JSON.parse(body.rooms);
    if (typeof body.amenities === 'string') body.amenities = JSON.parse(body.amenities);

    // Handle new hotel images
    if (req.files) {
      const hotelImgFiles = Array.isArray(req.files)
        ? req.files
        : (req.files.images || []);
      if (hotelImgFiles.length > 0) {
        const newUrls = hotelImgFiles.map(f => f.path);
        body.images = [...(hotel.images || []), ...newUrls];
      }

      // Handle per-room images (one per room)
      const roomImgFiles = Array.isArray(req.files) ? [] : (req.files.roomImages || []);
      if (roomImgFiles.length > 0 && Array.isArray(body.rooms)) {
        body.rooms = body.rooms.map((r, idx) => ({
          ...r,
          images: roomImgFiles[idx] ? [roomImgFiles[idx].path] : (r.images || []),
        }));
      }
    }

    const updated = await Hotel.findByIdAndUpdate(
      req.params.id,
      body,
      { new: true, runValidators: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getOwnerHotels,
  getOwnerStats,
  getOwnerBookings,
  acceptBooking,
  rejectBooking,
  deleteHotel,
  publishHotel,
  updateHotel,
};

