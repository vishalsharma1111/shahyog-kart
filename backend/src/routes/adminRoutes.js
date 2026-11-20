const express = require('express');
const router = express.Router();
const {
  getAdminStats,
  getAdminUsers,
  updateUserStatus,
  getPendingVerifications,
  verifyPartner,
  getAdminNgos,
  getAdminDonations,
  getAdminDistributionRecords,
  getAdminDeliveryPartners,
  getAdminPickupRequests,
  resetPickupRequest,
  getAdminProducts,
  toggleProductStatus,
  getAdminOrders,
  createCategory,
  getAdminCoinLedger
} = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

// All admin routes require admin authentication
router.use(authenticate, authorize('admin'));

// 1. Stats & Analytics
router.get('/stats', getAdminStats);

// 2. User Management
router.get('/users', getAdminUsers);
router.patch('/users/:userId/status', updateUserStatus);

// 3. Verifications
router.get('/verifications', getPendingVerifications);
router.patch('/verifications/:userId', verifyPartner);

// 4. NGOs Directory
router.get('/ngos', getAdminNgos);

// 5. Donations & Distribution Monitoring
router.get('/donations', getAdminDonations);
router.get('/distribution-records', getAdminDistributionRecords);

// 6. Delivery Fleet & Pickups
router.get('/delivery-partners', getAdminDeliveryPartners);
router.get('/pickup-requests', getAdminPickupRequests);
router.post('/pickup-requests/:id/reset', resetPickupRequest);

// 7. E-Commerce Moderation
router.get('/products', getAdminProducts);
router.patch('/products/:id/toggle', toggleProductStatus);
router.get('/orders', getAdminOrders);
router.post('/categories', createCategory);

// 8. Coin Ledger & Economy
router.get('/coins/ledger', getAdminCoinLedger);

module.exports = router;
