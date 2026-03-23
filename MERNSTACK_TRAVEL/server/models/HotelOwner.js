const mongoose = require('mongoose');

// Hotel owner profile (separate from auth user for extensibility)
const hotelOwnerSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, default: '' },

    // Location is intentionally flexible (city or address line)
    location: { type: String, required: true, trim: true },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('HotelOwner', hotelOwnerSchema);

