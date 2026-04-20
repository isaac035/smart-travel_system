const mongoose = require('mongoose');

const bundleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    totalPrice: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    images: [{ type: String }],
    location: [{ type: String }],
    targetTravelerType: {
      type: String,
      enum: ['solo', 'couple', 'family', 'group', 'any'],
      default: 'any',
    },
    tripCategory: {
      type: String,
      enum: ['adventure', 'relaxation', 'luxury', 'nature', 'beach', 'cultural', 'mixed'],
      default: 'mixed',
    },
    recommendedDestination: [{ type: String, trim: true }],
    minBudget: { type: Number, default: 0 },
    maxBudget: { type: Number, default: 0 },
    recommendedWeather: {
      type: String,
      enum: ['hot', 'cold', 'rainy', 'mixed', 'any'],
      default: 'any',
    },
    recommendedDuration: {
      type: String,
      enum: ['short', 'medium', 'long', 'any'],
      default: 'any',
    },
    suitabilityTags: [{ type: String, trim: true }],
    activityLevel: {
      type: String,
      enum: ['low', 'moderate', 'high'],
      default: 'moderate',
    },
    ageSuitability: {
      type: String,
      enum: ['kids', 'adults', 'all'],
      default: 'all',
    },
    isRecommended: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Bundle', bundleSchema);
