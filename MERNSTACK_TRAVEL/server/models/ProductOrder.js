const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, required: true },
  type:   { type: String, enum: ['product', 'bundle'], required: true },
  name:   { type: String },
  price:  { type: Number },
  qty:    { type: Number, default: 1 },
});


const productOrderSchema = new mongoose.Schema(
  {
    userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items:   [orderItemSchema],
    amount:  { type: Number, required: true },
    slipUrl: { type: String },
    status:  { type: String, enum: ['pending', 'confirmed', 'rejected', 'cancelled'], default: 'pending' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ProductOrder', productOrderSchema);
