const express = require('express');
const router = express.Router();
const { getStats, getAllPayments, updatePaymentStatus, getUsers, updateUser, updateUserRole, deleteUser, promoteToGuide, getGuideBookings, getTourBookings, getHotelBookings, getProductOrders, updateUserStatus, getUserDetails, createAdmin } = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');


router.use(protect, adminOnly);

router.get('/stats', getStats);
router.get('/payments', getAllPayments);
router.put('/payments/:type/:id/status', updatePaymentStatus);
router.get('/tour-bookings', getTourBookings);
router.get('/hotel-bookings', getHotelBookings);
router.get('/product-orders', getProductOrders);

router.post('/users/create-admin', createAdmin);
router.get('/users', getUsers);
router.get('/users/:id', getUserDetails);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id/status', updateUserStatus);
router.put('/users/:id/promote-guide', promoteToGuide);
router.get('/users/:id/guide-bookings', getGuideBookings);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

module.exports = router;

