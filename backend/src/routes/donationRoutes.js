const express = require('express');
const router = express.Router();
const { getNgos, getNgoById, createDonation, getMyDonations } = require('../controllers/donationController');
const { optionalAuth, authenticate } = require('../middleware/auth');

router.get('/ngos', getNgos);
router.get('/ngos/:id', getNgoById);
router.post('/', optionalAuth, createDonation);
router.get('/my', authenticate, getMyDonations);

module.exports = router;
