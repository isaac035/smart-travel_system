const Product = require('../models/Product');
const Bundle = require('../models/Bundle');
const Cart = require('../models/Cart');


// ─── PRODUCTS ─────────────────────────────────────────────────

const getProducts = async (req, res) => {
  try {
    const filter = { isActive: true };
    if (req.query.search) filter.name = { $regex: req.query.search, $options: 'i' };
    if (req.query.location) {
      filter.$or = [
        { location: { $regex: req.query.location, $options: 'i' } },
        { location: 'All Locations' }
      ];
    }
    if (req.query.weatherType && req.query.weatherType !== 'ALL') {
      filter.weatherType = { $in: [req.query.weatherType, 'BOTH'] };
    }
    if (req.query.minPrice) filter.price = { $gte: Number(req.query.minPrice) };
    if (req.query.maxPrice) filter.price = { ...filter.price, $lte: Number(req.query.maxPrice) };
    // Availability filter (comma-separated: in_stock,out_of_stock,coming_soon,pre_order)
    if (req.query.availability) {
      const vals = req.query.availability.split(',').filter(Boolean);
      if (vals.length > 0) filter.availability = { $in: vals };
    } else {
      // legacy inStock param kept for backwards compat
      if (req.query.inStock === 'true') filter.stock = { $gt: 0 };
      if (req.query.inStock === 'false') filter.stock = 0;
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createProduct = async (req, res) => {
  try {
    const images = req.files ? req.files.map((f) => f.path) : [];
    const body = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body;
    const product = await Product.create({ ...body, images });
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const body = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body;
    const updates = { ...body };
    const existingImages = updates.existingImages || null;
    delete updates.existingImages;
    if (existingImages !== null || (req.files && req.files.length > 0)) {
      const kept = existingImages !== null ? existingImages : (product.images || []);
      const newImages = req.files ? req.files.map((f) => f.path) : [];
      updates.images = [...kept, ...newImages];
    }

    const updated = await Product.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── BUNDLES ─────────────────────────────────────────────────

const getBundles = async (req, res) => {
  try {
    const bundles = await Bundle.find({ isActive: true }).populate('products').sort({ createdAt: -1 });
    res.json(bundles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getBundle = async (req, res) => {
  try {
    const bundle = await Bundle.findById(req.params.id).populate('products');
    if (!bundle) return res.status(404).json({ message: 'Bundle not found' });
    res.json(bundle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createBundle = async (req, res) => {
  try {
    const images = req.files ? req.files.map((f) => f.path) : [];
    const body = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body;
    let products = body.products;
    if (typeof products === 'string') products = JSON.parse(products);
    const bundle = await Bundle.create({ ...body, images, products: products || [] });
    res.status(201).json(bundle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateBundle = async (req, res) => {
  try {
    const bundle = await Bundle.findById(req.params.id);
    if (!bundle) return res.status(404).json({ message: 'Bundle not found' });

    const body = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body;
    const updates = { ...body };
    if (typeof updates.products === 'string') updates.products = JSON.parse(updates.products);
    const existingImages = updates.existingImages || null;
    delete updates.existingImages;
    if (existingImages !== null || (req.files && req.files.length > 0)) {
      const kept = existingImages !== null ? existingImages : (bundle.images || []);
      const newImages = req.files ? req.files.map((f) => f.path) : [];
      updates.images = [...kept, ...newImages];
    }

    const updated = await Bundle.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteBundle = async (req, res) => {
  try {
    await Bundle.findByIdAndDelete(req.params.id);
    res.json({ message: 'Bundle deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── CART ─────────────────────────────────────────────────────

const getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) return res.json({ items: [] });

    // Populate items with product/bundle data
    const populated = [];
    for (const item of cart.items) {
      if (item.type === 'product') {
        const p = await Product.findById(item.itemId);
        if (p) populated.push({ ...item.toObject(), details: p });
      } else {
        const b = await Bundle.findById(item.itemId).populate('products');
        if (b) populated.push({ ...item.toObject(), details: b });
      }
    }
    res.json({ _id: cart._id, items: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addToCart = async (req, res) => {
  try {
    const { itemId, type, qty = 1 } = req.body;
    let cart = await Cart.findOne({ userId: req.user._id });

    if (!cart) {
      cart = await Cart.create({ userId: req.user._id, items: [{ itemId, type, qty }] });
    } else {
      const existing = cart.items.find((i) => i.itemId.toString() === itemId && i.type === type);
      if (existing) {
        existing.qty += Number(qty);
      } else {
        cart.items.push({ itemId, type, qty });
      }
      await cart.save();
    }
    res.json({ message: 'Added to cart', itemCount: cart.items.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateCartItem = async (req, res) => {
  try {
    const { itemId, qty } = req.body;
    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    const item = cart.items.find((i) => i._id.toString() === itemId);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    if (qty <= 0) {
      cart.items = cart.items.filter((i) => i._id.toString() !== itemId);
    } else {
      item.qty = qty;
    }
    await cart.save();
    res.json({ message: 'Cart updated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    cart.items = cart.items.filter((i) => i._id.toString() !== req.params.itemId);
    await cart.save();
    res.json({ message: 'Item removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const clearCart = async (req, res) => {
  try {
    await Cart.findOneAndUpdate({ userId: req.user._id }, { items: [] });
    res.json({ message: 'Cart cleared' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProducts, getProduct, createProduct, updateProduct, deleteProduct,
  getBundles, getBundle, createBundle, updateBundle, deleteBundle,
  getCart, addToCart, updateCartItem, removeFromCart, clearCart,
};
