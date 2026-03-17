const mongoose = require('mongoose');

const tourBookingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    packageId: { type: mongoose.Schema.Types.ObjectId, ref: 'TourPackage', required: true },
    vehicle: { type: String, enum: ['car', 'van', 'bus'], required: true },
    travelers: { type: Number, required: true, min: 1 },
    startDate: { type: Date, required: true },
    totalPrice: { type: Number, required: true },
    slipUrl: { type: String },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'rejected', 'cancelled'],
      default: 'pending',
    },
    notes: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TourBooking', tourBookingSchema);
