const Hotel = require('../models/Hotel');
const HotelBooking = require('../models/HotelBooking');

// ─── HOTEL CRUD ───────────────────────────────────────────────

// @route GET /api/hotels
const getHotels = async (req, res) => {
  try {
    const filter = { isActive: true };

    if (req.query.location) filter.location = { $regex: req.query.location, $options: 'i' };
    if (req.query.rating) filter.starRating = { $gte: Number(req.query.rating) };
    if (req.query.minPrice) filter.pricePerNight = { $gte: Number(req.query.minPrice) };
    if (req.query.maxPrice) {
      filter.pricePerNight = { ...filter.pricePerNight, $lte: Number(req.query.maxPrice) };
    }
    if (req.query.filter === 'hot-deals') filter.discount = { $gt: 0 };
    if (req.query.filter === 'popular') filter.isPopular = true;

    let sort = { createdAt: -1 };
    if (req.query.sort === 'rating_desc') sort = { averageRating: -1 };
    if (req.query.sort === 'price_asc') sort = { pricePerNight: 1 };
    if (req.query.sort === 'price_desc') sort = { pricePerNight: -1 };

    const hotels = await Hotel.find(filter).sort(sort);
    res.json(hotels);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/hotels/:id
const getHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) return res.status(404).json({ message: 'Hotel not found' });
    res.json(hotel);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route POST /api/hotels  (admin)
const createHotel = async (req, res) => {
  try {
    const images = req.files ? req.files.map((f) => f.path) : [];

    // Frontend sends fields wrapped in a 'data' JSON string
    const body = req.body.data ? JSON.parse(req.body.data) : req.body;

    let coordinates = body.coordinates;
    if (typeof coordinates === 'string') coordinates = JSON.parse(coordinates);

    let rooms = body.rooms;
    if (typeof rooms === 'string') rooms = JSON.parse(rooms);

    let amenities = body.amenities;
    if (typeof amenities === 'string') amenities = JSON.parse(amenities);

    // If hotel pricePerNight not provided, derive it from the cheapest room.
    const roomsWithPrice = Array.isArray(rooms) ? rooms : [];
    const derivedHotelPrice = roomsWithPrice
      .map((r) => Number(r?.pricePerNight || 0))
      .filter((n) => n > 0);

    const hotelOwnerId = req.user?.role === 'hotelOwner' ? req.user._id : undefined;

    const hotel = await Hotel.create({
      ...body,
      images,
      coordinates,
      rooms: rooms || [],
      amenities: amenities || [],
      hotelOwnerId,
      pricePerNight:
        body.pricePerNight !== undefined && body.pricePerNight !== ''
          ? body.pricePerNight
          : (derivedHotelPrice.length ? Math.min(...derivedHotelPrice) : 0),
    });

    res.status(201).json(hotel);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route PUT /api/hotels/:id  (admin)
const updateHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) return res.status(404).json({ message: 'Hotel not found' });

    const parsed = req.body.data ? JSON.parse(req.body.data) : req.body;
    const updates = { ...parsed };

    if (typeof updates.coordinates === 'string') updates.coordinates = JSON.parse(updates.coordinates);
    if (typeof updates.rooms === 'string') updates.rooms = JSON.parse(updates.rooms);
    if (typeof updates.amenities === 'string') updates.amenities = JSON.parse(updates.amenities);

    const existingImages = updates.existingImages || null;
    delete updates.existingImages;
    if (existingImages !== null || (req.files && req.files.length > 0)) {
      const kept = existingImages !== null ? existingImages : (hotel.images || []);
      const newImages = req.files ? req.files.map((f) => f.path) : [];
      updates.images = [...kept, ...newImages];
    }

    const updated = await Hotel.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route DELETE /api/hotels/:id  (admin)
const deleteHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) return res.status(404).json({ message: 'Hotel not found' });
    await hotel.deleteOne();
    res.json({ message: 'Hotel deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route POST /api/hotels/:id/reviews
const addReview = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) return res.status(404).json({ message: 'Hotel not found' });

    const { rating, comment } = req.body;

    // Prevent duplicate reviews from same user
    const existing = hotel.reviews.find((r) => r.userId?.toString() === req.user._id.toString());
    if (existing) return res.status(400).json({ message: 'You have already reviewed this hotel' });

    hotel.reviews.push({
      userId: req.user._id,
      userName: req.user.name,
      userAvatar: req.user.avatar,
      rating: Number(rating),
      comment,
    });

    hotel.updateRating();
    await hotel.save();
    res.status(201).json({ message: 'Review added', averageRating: hotel.averageRating, reviewCount: hotel.reviewCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── BOOKINGS ─────────────────────────────────────────────────

// @route POST /api/hotel-bookings
const createBooking = async (req, res) => {
  try {
    const booking = await HotelBooking.create({ ...req.body, userId: req.user._id });
    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/hotel-bookings/my
const getMyBookings = async (req, res) => {
  try {
    const bookings = await HotelBooking.find({ userId: req.user._id })
      .populate('hotelId', 'name images location starRating address')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/hotel-bookings  (admin)
const getAllBookings = async (req, res) => {
  try {
    const bookings = await HotelBooking.find()
      .populate('hotelId', 'name location')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route PUT /api/hotel-bookings/:id/status  (admin)
const updateBookingStatus = async (req, res) => {
  try {
    const booking = await HotelBooking.findById(req.params.id).populate('hotelId', 'hotelOwnerId');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Admin can update any booking, hotel owner can update bookings for hotels they own.
    if (req.user?.role === 'hotelOwner') {
      const ownerId = booking.hotelId?.hotelOwnerId?.toString();
      const currentOwnerId = req.user._id?.toString();
      if (!ownerId || ownerId !== currentOwnerId) {
        return res.status(403).json({ message: 'Access denied: Not your hotel booking' });
      }
    } else if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    booking.status = req.body.status;
    await booking.save();
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getHotels, getHotel, createHotel, updateHotel, deleteHotel, addReview,
  createBooking, getMyBookings, getAllBookings, updateBookingStatus,
};
