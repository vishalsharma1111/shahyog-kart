const coinService = require('../services/coinService');

// @desc Get user's Shahyog Coin Wallet & Transactions
// @route GET /api/coins/my-wallet
const getMyWallet = async (req, res) => {
  try {
    const summary = await coinService.getUserCoinSummary(req.user.id);
    res.json({ success: true, wallet: summary, ...summary });
  } catch (err) {
    console.error('Error fetching coin wallet:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Get active reward rules
// @route GET /api/coins/rules
const getRewardRules = async (req, res) => {
  try {
    const rules = await coinService.getRewardRules();
    res.json({ success: true, rules });
  } catch (err) {
    console.error('Error fetching reward rules:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Admin update a reward rule
// @route PUT /api/coins/rules/:id
const updateRewardRule = async (req, res) => {
  try {
    const ruleId = parseInt(req.params.id, 10);
    const { coins_per_unit, description, is_active } = req.body;

    const updated = await coinService.updateRewardRule(
      ruleId,
      coins_per_unit,
      description,
      is_active !== undefined ? is_active : true
    );

    res.json({
      success: true,
      message: 'Reward rule updated successfully!',
      rule: updated
    });
  } catch (err) {
    console.error('Error updating reward rule:', err);
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc Admin create a new reward rule
// @route POST /api/coins/rules
const createRewardRule = async (req, res) => {
  try {
    const { category, coins_per_unit, description, item_name_pattern } = req.body;

    if (!category || !coins_per_unit) {
      return res.status(400).json({ success: false, message: 'Category and coins_per_unit are required.' });
    }

    const created = await coinService.createRewardRule(
      category,
      coins_per_unit,
      description || `${coins_per_unit} coins per unit`,
      item_name_pattern
    );

    res.status(201).json({
      success: true,
      message: 'Reward rule created successfully!',
      rule: created
    });
  } catch (err) {
    console.error('Error creating reward rule:', err);
    res.status(400).json({ success: false, message: err.message });
  }
};

module.exports = {
  getMyWallet,
  getRewardRules,
  updateRewardRule,
  createRewardRule
};
