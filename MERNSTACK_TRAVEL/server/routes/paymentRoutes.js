const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { upload, cloudinary } = require('../config/cloudinary');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Bundle = require('../models/Bundle');
const ProductOrder = require('../models/ProductOrder');


// POST /api/payments/upload-slip
// Authenticated user submits cart + payment slip to create a product order
router.post('/upload-slip', protect, upload.single('slip'), async (req, res) => {
  try {
    const userId = req.user._id;
    const amount = parseFloat(req.body.amount) || 0;

    if (!req.file) {
      return res.status(400).json({ message: 'Payment slip image is required' });
    }

    const slipUrl = req.file.path; // Cloudinary URL

    // Fetch current cart to snapshot items
    const cart = await Cart.findOne({ userId });
    const cartItems = cart ? cart.items : [];

    // Build a snapshot of order items with names/prices
    const orderItems = [];
    for (const item of cartItems) {
      if (item.type === 'product') {
        const p = await Product.findById(item.itemId).select('name price');
        orderItems.push({
          itemId: item.itemId,
          type: 'product',
          name: p?.name || 'Product',
          price: p?.price || 0,
          qty: item.qty,
        });
      } else {
        const b = await Bundle.findById(item.itemId).select('name totalPrice discount');
        const price = b ? b.totalPrice * (1 - (b.discount || 0) / 100) : 0;
        orderItems.push({
          itemId: item.itemId,
          type: 'bundle',
          name: b?.name || 'Bundle',
          price,
          qty: item.qty,
        });
      }
    }

    // Create the order
    const order = await ProductOrder.create({
      userId,
      items: orderItems,
      amount,
      slipUrl,
      status: 'pending',
    });

    res.status(201).json({ message: 'Order placed successfully', orderId: order._id });
  } catch (err) {
    console.error('upload-slip error:', err);
    res.status(500).json({ message: err.message || 'Failed to place order' });
  }
});

// GET /api/payments/my-orders
// Returns the logged-in user's product orders
router.get('/my-orders', protect, async (req, res) => {
  try {
    const orders = await ProductOrder.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
