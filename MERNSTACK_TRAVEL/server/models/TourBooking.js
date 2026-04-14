const mongoose = require('mongoose');

const tourBookingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    packageId: { type: mongoose.Schema.Types.ObjectId, ref: 'TourPackage', required: true },
    guideId: { type: mongoose.Schema.Types.ObjectId, ref: 'Guide', default: null },
    vehicle: { type: String, enum: ['car', 'van', 'bus'], required: true },
    travelers: { type: Number, required: true, min: 1 },
    customDuration: { type: Number, min: 1 }, // user-adjusted trip duration in days
    startDate: { type: Date, required: true },
    totalPrice: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'rejected', 'cancelled'],
      default: 'pending',
    },
    notes: { type: String },
    // Card payment fields
    payment: {
      cardHolder: { type: String, default: '' },
      cardLastFour: { type: String, default: '' },
      advancePaid: { type: Number, default: 0 },   // 20% of totalPrice
      remainingAmount: { type: Number, default: 0 }, // 80% of totalPrice
      paymentStatus: {
        type: String,
        enum: ['advance_paid', 'fully_paid'],
        default: 'advance_paid',
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TourBooking', tourBookingSchema);
