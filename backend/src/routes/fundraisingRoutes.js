const express = require('express');
const router = express.Router();
const {
  getActiveCampaigns,
  getCampaignDetails,
  createCampaign,
  getNgoCampaigns,
  initiateFundDonation,
  verifyPaymentTransaction,
  getAdminFundTransactions
} = require('../controllers/fundraisingController');
const { authenticate, authorize } = require('../middleware/auth');

// Public routes
router.get('/campaigns', getActiveCampaigns);
router.get('/campaigns/:id', getCampaignDetails);
router.post('/donate', initiateFundDonation);
router.post('/verify-payment', verifyPaymentTransaction);

// NGO campaign management
router.get('/my-campaigns', authenticate, authorize('ngo'), getNgoCampaigns);
router.post('/my-campaigns', authenticate, authorize('ngo'), createCampaign);

// Admin transactions
router.get('/admin/transactions', authenticate, authorize('admin'), getAdminFundTransactions);

module.exports = router;
