const mongoose = require('mongoose');

const tripLocationSchema = new mongoose.Schema({
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
  notes: { type: String, default: '' },
  order: { type: Number, default: 0 },
});

const tripDaySchema = new mongoose.Schema({
  dayNumber: { type: Number, required: true },
  locations: [tripLocationSchema],
});

const tripPlanSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    days: [tripDaySchema],
    startPoint: {
      lat: { type: Number },
      lng: { type: Number },
      name: { type: String, default: 'Colombo' },
    },
    pace: {
      type: String,
      enum: ['relaxed', 'moderate', 'packed'],
      default: 'moderate',
    },
    totalDistance: { type: Number, default: 0 },
    totalDuration: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TripPlan', tripPlanSchema);
