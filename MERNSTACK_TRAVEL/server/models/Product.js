const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    stock: { type: Number, default: 0 },
    images: [{ type: String }],
    location: { type: String },
    weatherType: { type: String, enum: ['DRY', 'RAINY', 'BOTH'], default: 'BOTH' },
    availability: { type: String, enum: ['in_stock', 'out_of_stock', 'coming_soon', 'pre_order'], default: 'in_stock' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
