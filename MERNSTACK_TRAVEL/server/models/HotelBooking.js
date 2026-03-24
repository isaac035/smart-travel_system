const mongoose = require('mongoose');

const hotelBookingSchema = new mongoose.Schema(
  {
    hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    roomType: { type: String, required: true },
    roomCount: { type: Number, default: 1 },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    nights: { type: Number },
    guests: {
      adults: { type: Number, default: 1 },
      children: { type: Number, default: 0 },
    },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    specialRequests: { type: String },
    pricePerNight: { type: Number },
    subtotal: { type: Number },
    tax: { type: Number },
    totalPrice: { type: Number, required: true },
    paymentSlip: { type: String },
    paymentStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    status: { type: String, enum: ['pending', 'confirmed', 'rejected', 'cancelled', 'completed'], default: 'pending' },
  },
  { timestamps: true }
);

// Auto-calculate nights before save
hotelBookingSchema.pre('save', function () {
  if (this.checkIn && this.checkOut) {
    const diff = new Date(this.checkOut) - new Date(this.checkIn);
    this.nights = Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
});

module.exports = mongoose.model('HotelBooking', hotelBookingSchema);
