const express = require('express');
const router = express.Router();
const {
  getDeliveryOverview,
  getAvailablePickups,
  acceptPickup,
  getMyDeliveries,
  updateAssignmentStatus,
  requestOtp,
  verifyOtp,
  getTracking
} = require('../controllers/deliveryController');
const { authenticate, authorize, requireVerified } = require('../middleware/auth');

// Public tracking endpoint (accessible to donors, NGOs, customers)
router.get('/tracking/:identifier', getTracking);

// Protected routes for Delivery Partner & Admin
router.use(authenticate, authorize('delivery', 'admin'), requireVerified);

router.get('/overview', getDeliveryOverview);
router.get('/available-pickups', getAvailablePickups);
router.post('/pickups/:id/accept', acceptPickup);
router.get('/my-deliveries', getMyDeliveries);
router.patch('/assignments/:id/status', updateAssignmentStatus);
router.patch('/active/:id/status', updateAssignmentStatus);
router.post('/assignments/:id/request-otp', requestOtp);
router.post('/assignments/:id/verify-otp', verifyOtp);
router.post('/active/:id/verify-otp', verifyOtp);

module.exports = router;
