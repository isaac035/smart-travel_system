const mongoose = require('mongoose');

const tourPackageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    destination: { type: String, trim: true },
    description: { type: String, required: true },
    images: [{ type: String }],
    locations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Location' }],
    duration: { type: Number, required: true },
    basePrice: { type: Number, required: true },
    vehicleOptions: [{ type: String, enum: ['car', 'van', 'bus'] }],
    vehicleMultipliers: {
      car: { type: Number, default: 1.0 },
      van: { type: Number, default: 1.3 },
      bus: { type: Number, default: 1.6 },
    },
    maxTravelersByVehicle: {
      car: { type: Number, default: 4 },
      van: { type: Number, default: 8 },
      bus: { type: Number, default: 50 },
    },
    guideIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Guide' }],
    includes: [{ type: String }],
    excludes: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TourPackage', tourPackageSchema);
