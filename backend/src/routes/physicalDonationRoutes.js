const express = require('express');
const router = express.Router();
const {
  createItemDonation,
  getMyItemDonations,
  getItemDonationDetails,
  getDonationMatches,
  offerDonationToNgo,
  updateDonationStatus,
  getAllItemDonations
} = require('../controllers/physicalDonationController');
const { optionalAuth, authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public / Authenticated submission of physical donations
router.post('/', optionalAuth, upload.single('image'), createItemDonation);

// Get current user's submitted physical donations
router.get('/my', authenticate, getMyItemDonations);

// Smart Matching Recommendations
router.get('/:id/matches', getDonationMatches);
router.get('/:id/recommendations', getDonationMatches);

// Offer donation to selected NGO
router.post('/:id/offer', optionalAuth, offerDonationToNgo);

// Update status along 11 stages
router.patch('/:id/status', updateDonationStatus);

// Public / Authenticated tracking of donation by code or ID
router.get('/track/:identifier', getItemDonationDetails);
router.get('/:identifier', getItemDonationDetails);

// Admin / Inspection: List all physical item donations
router.get('/', authenticate, authorize('admin'), getAllItemDonations);

module.exports = router;
