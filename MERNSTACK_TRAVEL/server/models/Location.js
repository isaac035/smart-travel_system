const mongoose = require('mongoose');

const CATEGORIES = {
  Nature: ['Mountain', 'Waterfall', 'River', 'Forest', 'Cave', 'Botanical Garden', 'Farm'],
  Beach: ['Beach', 'Lagoon', 'Island'],
  Wildlife: ['National Park', 'Safari', 'Wildlife Sanctuary'],
  Historical: ['Fort', 'Archaeological Site', 'Museum'],
  Religious: ['Temple', 'Church', 'Mosque', 'Kovil'],
  'Hill Country': ['Tea Estate', 'View Point'],
  Adventure: ['Hiking', 'Camping', 'Diving', 'Boat Tour'],
  City: ['Urban Attractions', 'Street Food Area', 'Shopping'],
  Entertainment: ['Zoo', 'Water Park and Aquarium'],
};

const locationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: Object.keys(CATEGORIES),
    },
    subcategory: {
      type: String,
      required: true,
    },
    images: [{ type: String }],
    mapImage: { type: String },
    province: { type: String, required: true },
    district: { type: String, required: true },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Export categories map for use in controllers/frontend
locationSchema.statics.CATEGORIES = CATEGORIES;

module.exports = mongoose.model('Location', locationSchema);
