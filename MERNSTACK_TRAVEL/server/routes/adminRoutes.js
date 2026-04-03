const express = require('express');
const router = express.Router();
const {
  getStats, getAllPayments, updatePaymentStatus,
  getUsers, updateUser, updateUserRole, deleteUser, promoteToGuide, getGuideBookings,
  getTourBookings, getHotelBookings, getProductOrders,
  updateUserStatus, getUserDetails, createAdmin,
  getOwnerSubmittedHotels, updateOwnerHotelApproval, updateOwnerHotelDetails,
  getSupportRequests, updateSupportRequest, clearRejectedRequests,
  clearRejectedTourBookings,
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');


router.use(protect, adminOnly);

router.get('/stats', getStats);
router.get('/payments', getAllPayments);
router.put('/payments/:type/:id/status', updatePaymentStatus);
router.get('/tour-bookings', getTourBookings);
router.delete('/tour-bookings/rejected', clearRejectedTourBookings);
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

// Owner-submitted hotel management
router.get('/owner-hotels', getOwnerSubmittedHotels);
router.put('/owner-hotels/:id/approval', updateOwnerHotelApproval);
router.put('/owner-hotels/:id', updateOwnerHotelDetails);

// Emergency Support Management
router.get('/support', getSupportRequests);
router.put('/support/:id', updateSupportRequest);
router.delete('/support/rejected', clearRejectedRequests);

module.exports = router;

