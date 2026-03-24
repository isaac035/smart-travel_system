const express = require('express');
const router = express.Router();
const {
  getProducts, getProduct, createProduct, updateProduct, deleteProduct,
  getBundles, getBundle, createBundle, updateBundle, deleteBundle,
  getCart, addToCart, updateCartItem, removeFromCart, clearCart,
} = require('../controllers/productController');
const {
  getBankAccounts, createBankAccount, updateBankAccount, deleteBankAccount,
} = require('../controllers/bankAccountController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');


// ─── Products ─────────────────────────────────────────────────
router.get('/products', getProducts);
router.get('/products/:id', getProduct);
router.post('/products', protect, adminOnly, upload.array('images', 10), createProduct);
router.put('/products/:id', protect, adminOnly, upload.array('images', 10), updateProduct);
router.delete('/products/:id', protect, adminOnly, deleteProduct);

// ─── Bundles ──────────────────────────────────────────────────
router.get('/bundles', getBundles);
router.get('/bundles/:id', getBundle);
router.post('/bundles', protect, adminOnly, upload.array('images', 10), createBundle);
router.put('/bundles/:id', protect, adminOnly, upload.array('images', 10), updateBundle);
router.delete('/bundles/:id', protect, adminOnly, deleteBundle);

// ─── Cart ─────────────────────────────────────────────────────
router.get('/cart', protect, getCart);
router.post('/cart/add', protect, addToCart);
router.put('/cart/update', protect, updateCartItem);
router.delete('/cart/remove/:itemId', protect, removeFromCart);
router.delete('/cart/clear', protect, clearCart);

// ─── Bank Accounts ────────────────────────────────────────────
router.get('/bank-accounts', getBankAccounts);
router.post('/bank-accounts', protect, adminOnly, createBankAccount);
router.put('/bank-accounts/:id', protect, adminOnly, updateBankAccount);
router.delete('/bank-accounts/:id', protect, adminOnly, deleteBankAccount);

module.exports = router;
