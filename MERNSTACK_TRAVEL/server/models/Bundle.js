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
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Bundle', bundleSchema);
