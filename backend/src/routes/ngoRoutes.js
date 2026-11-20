const express = require('express');
const router = express.Router();
const {
  getNgoDashboardOverview,
  getNgoProfile,
  updateNgoProfile,
  getNgoRequirements,
  createNgoRequirement,
  updateNgoRequirement,
  deleteNgoRequirement,
  getIncomingDonations,
  respondToDonationOffer,
  recordDonationReceipt,
  getNgoInventory,
  recordDistribution,
  getDistributions,
  getArrivingDeliveries,
  getDistributionRecords,
  getNgoReports
} = require('../controllers/ngoController');
const { authenticate, authorize, requireVerified } = require('../middleware/auth');
const { query } = require('../config/db');

// Protect all NGO routes
router.use(authenticate, authorize('ngo', 'admin'));

// Dashboard overview & Profile (accessible even if pending)
router.get('/overview', getNgoDashboardOverview);
router.get('/profile', getNgoProfile);
router.put('/profile', updateNgoProfile);

// Requirements management
router.get('/requirements', getNgoRequirements);
router.post('/requirements', requireVerified, createNgoRequirement);
router.put('/requirements/:id', requireVerified, updateNgoRequirement);
router.delete('/requirements/:id', requireVerified, deleteNgoRequirement);

// Incoming donation offers & accept/reject
router.get('/incoming-donations', getIncomingDonations);
router.post('/donations/:donationId/respond', requireVerified, respondToDonationOffer);
router.post('/offers/:matchingId/respond', requireVerified, async (req, res, next) => {
  const [matching] = await query('SELECT donation_id FROM donation_matching WHERE id = ?', [req.params.matchingId]);
  if (matching) {
    req.params.donationId = matching.donation_id;
  } else {
    req.params.donationId = req.params.matchingId;
  }
  return respondToDonationOffer(req, res, next);
});

// Physical receipt logging
router.post('/donations/:donationId/receipt', requireVerified, recordDonationReceipt);

// Incoming deliveries & OTP verification access
router.get('/deliveries/arriving', getArrivingDeliveries);

// Inventory & Distribution
router.get('/inventory', getNgoInventory);
router.post('/distributions', requireVerified, recordDistribution);
router.get('/distributions', getDistributions);
router.get('/distribution-records', getDistributionRecords);

// Analytics & Reports
router.get('/reports', getNgoReports);

module.exports = router;
