const mongoose = require('mongoose');

const guideSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, sparse: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    image: { type: String, default: '' },
    languages: [{ type: String }],
    experience: { type: Number, default: 1 },
    location: { type: String, required: true },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    pricePerDay: { type: Number, required: true },
    certifications: [{ type: String }],
    services: [{ type: String }],
    bio: { type: String },
    isAvailable: { type: Boolean, default: true },
    isApproved: { type: Boolean, default: false },
    approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    rejectionReason: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Guide', guideSchema);
