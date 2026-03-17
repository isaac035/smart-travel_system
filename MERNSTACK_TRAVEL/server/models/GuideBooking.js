const mongoose = require('mongoose');

const guideReviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: String,
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const guideBookingSchema = new mongoose.Schema(
  {
    guideId: { type: mongoose.Schema.Types.ObjectId, ref: 'Guide', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Traveler info
    travelerName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },

    // Trip details — startDate + endDate for conflict detection
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    days: { type: Number, required: true, min: 1 },
    travelers: { type: Number, default: 1 },
    location: { type: String, required: true },
    specialRequests: { type: String },

    // Pricing — deposit-based
    totalPrice: { type: Number, required: true },
    depositPercentage: { type: Number, default: 30 },
    depositAmount: { type: Number, required: true },
    remainingAmount: { type: Number, required: true },

    // Payment slips
    depositSlip: { type: String },
    remainingSlip: { type: String },

    // Status workflow
    status: {
      type: String,
      enum: [
        'pending_deposit',
        'deposit_submitted',
        'pending_guide_review',
        'guide_accepted',
        'guide_rejected',
        'under_admin_review',
        'admin_confirmed',
        'remaining_payment_pending',
        'remaining_payment_submitted',
        'fully_paid',
        'completed',
        'cancelled_by_user',
        'cancelled_by_admin',
        'refund_pending',
        'partially_refunded',
        'refunded',
        'no_refund'
      ],
      default: 'deposit_submitted'
    },

    // Guide decision tracking
    guideDecision: {
      status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
      decidedAt: Date,
      reason: String
    },

    // Admin decision tracking
    adminDecision: {
      depositVerified: { type: Boolean, default: false },
      remainingVerified: { type: Boolean, default: false },
      confirmedAt: Date,
      rejectedAt: Date,
      reason: String
    },

    // Cancellation & refund
    cancellation: {
      cancelledBy: { type: String, enum: ['user', 'admin', 'guide'] },
      cancelledAt: Date,
      reason: String,
      refundEligibility: { type: String, enum: ['full', 'partial', 'none'] },
      refundAmount: { type: Number, default: 0 },
      refundStatus: { type: String, enum: ['pending', 'processed', 'none'], default: 'none' }
    },

    // Review
    review: guideReviewSchema,

    // Legacy field support
    travelDate: { type: Date },
    paymentSlip: { type: String },
    paymentStatus: { type: String, default: 'pending' }
  },
  { timestamps: true }
);

// Sync travelDate with startDate for backward compat
guideBookingSchema.pre('save', function () {
  if (this.startDate && !this.travelDate) {
    this.travelDate = this.startDate;
  }
});

module.exports = mongoose.model('GuideBooking', guideBookingSchema);
