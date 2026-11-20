const express = require('express');
const router = express.Router();
const {
  getMyWallet,
  getRewardRules,
  updateRewardRule,
  createRewardRule
} = require('../controllers/coinController');
const { authenticate, authorize } = require('../middleware/auth');

// Public: view active reward rules
router.get('/rules', getRewardRules);

// Customer/User Wallet
router.get('/my-wallet', authenticate, getMyWallet);

// Admin: Manage rules
router.put('/rules/:id', authenticate, authorize('admin'), updateRewardRule);
router.post('/rules', authenticate, authorize('admin'), createRewardRule);

module.exports = router;
