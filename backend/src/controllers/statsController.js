const { query } = require('../config/db');

// @desc Get real-time public impact statistics directly calculated from MySQL
// @route GET /api/stats/public
// @access Public
const getPublicImpactStats = async (req, res) => {
  try {
    const [stats] = await query(`
      SELECT
        (SELECT COUNT(*) FROM ngos WHERE verified_by_admin = 1) as totalVerifiedNgos,
        (SELECT COUNT(*) FROM donations) as totalDonations,
        (SELECT COUNT(*) FROM orders) as totalOrders,
        (SELECT COUNT(*) FROM products WHERE is_active = 1) as totalProducts,
        (SELECT COALESCE(SUM(beneficiary_count), 0) FROM distribution_records) as totalBeneficiaries,
        (
          SELECT COALESCE(SUM(amount), 0) 
          FROM fund_donations 
          WHERE payment_status = 'completed'
        ) + (
          SELECT COALESCE(SUM(amount), 0)
          FROM donations
          WHERE donation_type = 'monetary' AND payment_status = 'completed'
        ) as totalFundsRaised,
        (
          SELECT COALESCE(SUM(coins), 0) 
          FROM coin_transactions 
          WHERE type = 'earned'
        ) as totalCoinsIssued,
        (SELECT COUNT(*) FROM users WHERE role = 'seller' AND status = 'approved') as totalSellers,
        (SELECT COUNT(*) FROM users) as totalUsers
    `);

    res.json({
      success: true,
      stats: {
        totalVerifiedNgos: parseInt(stats.totalVerifiedNgos || 0, 10),
        totalDonations: parseInt(stats.totalDonations || 0, 10),
        totalOrders: parseInt(stats.totalOrders || 0, 10),
        totalProducts: parseInt(stats.totalProducts || 0, 10),
        totalBeneficiaries: parseInt(stats.totalBeneficiaries || 0, 10),
        totalFundsRaised: parseFloat(stats.totalFundsRaised || 0),
        totalCoinsIssued: parseInt(stats.totalCoinsIssued || 0, 10),
        totalSellers: parseInt(stats.totalSellers || 0, 10),
        totalUsers: parseInt(stats.totalUsers || 0, 10)
      }
    });
  } catch (error) {
    console.error('Error fetching public impact stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getPublicImpactStats };
