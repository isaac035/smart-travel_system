const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  type: { type: String, required: true },
  pricePerNight: { type: Number, required: true },
  capacity: { type: Number, default: 2 },
  count: { type: Number, default: 1 },
  amenities: [{ type: String }],
  images: [{ type: String }],

  // Optional metadata for richer UI (owner form)
  roomSize: { type: Number },
  bedType: { type: String },
  bedCount: { type: Number },

  hasHotDeal: { type: Boolean, default: false },
  originalPricePerNight: { type: Number },
  discountPercentage: { type: Number },
  discountValue: { type: Number },
});

const reviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: String,
  userAvatar: String,
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const hotelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    images: [{ type: String }],
    location: { type: String, required: true },
    address: { type: String },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
    starRating: { type: Number, min: 1, max: 5, default: 3 },
    pricePerNight: { type: Number, required: true },
    amenities: [{ type: String }],
    rooms: [roomSchema],
    phone: { type: String },
    email: { type: String },
    website: { type: String },
    discount: { type: Number, default: 0 },
    isPopular: { type: Boolean, default: false },
    reviews: [reviewSchema],
    reviewCount: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    weddings: {
      available: { type: Boolean, default: false },
      image: { type: String },
      description: { type: String },
    },
    events: {
      available: { type: Boolean, default: false },
      image: { type: String },
      description: { type: String },
    },
    dining: { type: String },
    checkInTime: { type: String, default: '14:00' },
    checkOutTime: { type: String, default: '12:00' },
    policies: { type: String },
    isActive: { type: Boolean, default: true },

    hotelOwnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // Approval workflow (for hotels submitted by hotel owners)
    approvalStatus: {
      type: String,
      enum: ['pending_approval', 'approved', 'hold'],
      default: 'pending_approval',
    },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);

// Recalculate average rating after review added
hotelSchema.methods.updateRating = function () {
  if (this.reviews.length === 0) {
    this.averageRating = 0;
    this.reviewCount = 0;
  } else {
    const total = this.reviews.reduce((sum, r) => sum + r.rating, 0);
    this.averageRating = Math.round((total / this.reviews.length) * 10) / 10;
    this.reviewCount = this.reviews.length;
  }
};

module.exports = mongoose.model('Hotel', hotelSchema);
