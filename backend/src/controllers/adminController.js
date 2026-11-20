const { query, transaction } = require('../config/db');

// ============================================================
// 1. ADVANCED ANALYTICS & STATS
// ============================================================

// @desc Get platform-wide admin metrics and analytics
// @route GET /api/admin/stats
const getAdminStats = async (req, res) => {
  try {
    const [userCount] = await query('SELECT COUNT(*) as totalUsers FROM users');
    const [partnerCounts] = await query(`
      SELECT
        SUM(CASE WHEN role = 'seller' THEN 1 ELSE 0 END) as totalSellers,
        SUM(CASE WHEN role = 'ngo' AND status = 'approved' THEN 1 ELSE 0 END) as totalVerifiedNgos,
        SUM(CASE WHEN role = 'ngo' THEN 1 ELSE 0 END) as totalNgos,
        SUM(CASE WHEN role = 'delivery' AND status = 'approved' THEN 1 ELSE 0 END) as totalVerifiedDeliveryPartners,
        SUM(CASE WHEN role = 'delivery' THEN 1 ELSE 0 END) as totalDeliveryPartners,
        SUM(CASE WHEN role = 'customer' THEN 1 ELSE 0 END) as totalCustomers,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingVerifications,
        SUM(CASE WHEN status = 'suspended' THEN 1 ELSE 0 END) as suspendedUsers
      FROM users
    `);

    // Products & Orders
    const [productCount] = await query('SELECT COUNT(*) as totalProducts FROM products WHERE is_active = 1');
    const [orderStats] = await query(`
      SELECT COUNT(*) as totalOrders,
             COALESCE(SUM(total_amount), 0) as totalRevenue,
             COALESCE(SUM(donation_amount), 0) as totalOrderDonations,
             COALESCE(SUM(coins_redeemed), 0) as totalCoinsRedeemedInOrders
      FROM orders
    `);

    // Monetary Donations & Verified Fundraising
    const [directDonations] = await query(`
      SELECT COUNT(*) as donationCount,
             COALESCE(SUM(amount), 0) as totalDirectDonated
      FROM donations
      WHERE donation_type = 'monetary' AND payment_status = 'completed'
    `);

    const [campaignFundStats] = await query(`
      SELECT COUNT(*) as campaignDonationsCount,
             COALESCE(SUM(amount), 0) as totalCampaignFundsRaised
      FROM fund_donations
      WHERE payment_status = 'completed'
    `);

    // Physical Item Donations
    const [itemDonationsStats] = await query(`
      SELECT
        COUNT(*) as totalItemDonations,
        COALESCE(SUM(quantity), 0) as totalItemUnitsDonated,
        SUM(CASE WHEN status IN ('Received by NGO', 'Distributed to beneficiaries', 'Distributed', 'Completed') THEN 1 ELSE 0 END) as totalReceivedDonations,
        SUM(CASE WHEN status IN ('Distributed to beneficiaries', 'Distributed', 'Completed') THEN 1 ELSE 0 END) as totalDistributedDonations,
        COALESCE(SUM(distributed_count), 0) as totalDistributedUnits
      FROM donations
      WHERE donation_type = 'item'
    `);

    // Beneficiaries Reported from Ground Distribution Records
    const [distStats] = await query(`
      SELECT COALESCE(SUM(beneficiary_count), 0) as totalBeneficiaries,
             COUNT(*) as distributionDrivesCount,
             COALESCE(SUM(distributed_quantity), 0) as totalDistributedQuantity
      FROM distribution_records
    `);

    // Coin Transactions Statistics
    const [coinStats] = await query(`
      SELECT
        COALESCE(SUM(CASE WHEN type = 'earned' THEN coins ELSE 0 END), 0) as totalCoinsIssued,
        COALESCE(SUM(CASE WHEN type = 'redeemed' THEN coins ELSE 0 END), 0) as totalCoinsRedeemed
      FROM coin_transactions
    `);

    // Category distribution breakdown for visual analytics
    const categoryBreakdown = await query(`
      SELECT category, COUNT(*) as count, COALESCE(SUM(quantity), 0) as totalUnits
      FROM donations
      WHERE donation_type = 'item'
      GROUP BY category
      ORDER BY totalUnits DESC
    `);

    res.json({
      success: true,
      stats: {
        totalUsers: userCount.totalUsers || 0,
        totalCustomers: partnerCounts.totalCustomers || 0,
        totalSellers: partnerCounts.totalSellers || 0,
        totalNgos: partnerCounts.totalNgos || 0,
        totalVerifiedNgos: partnerCounts.totalVerifiedNgos || 0,
        totalDeliveryPartners: partnerCounts.totalDeliveryPartners || 0,
        totalVerifiedDeliveryPartners: partnerCounts.totalVerifiedDeliveryPartners || 0,
        pendingVerifications: partnerCounts.pendingVerifications || 0,
        suspendedUsers: partnerCounts.suspendedUsers || 0,

        totalProducts: productCount.totalProducts || 0,
        totalOrders: orderStats.totalOrders || 0,
        totalRevenue: parseFloat(orderStats.totalRevenue || 0),

        totalDonations: (directDonations.donationCount || 0) + (itemDonationsStats.totalItemDonations || 0),
        totalReceivedDonations: itemDonationsStats.totalReceivedDonations || 0,
        totalDistributedItems: itemDonationsStats.totalDistributedUnits || distStats.totalDistributedQuantity || 0,
        totalBeneficiariesReported: distStats.totalBeneficiaries || 0,
        distributionDrivesCount: distStats.distributionDrivesCount || 0,

        totalRewardCoinsIssued: coinStats.totalCoinsIssued || 0,
        totalRewardCoinsRedeemed: coinStats.totalCoinsRedeemed || 0,

        totalDonationsRaised: parseFloat(orderStats.totalOrderDonations || 0) + 
                              parseFloat(directDonations.totalDirectDonated || 0) + 
                              parseFloat(campaignFundStats.totalCampaignFundsRaised || 0),
        totalCampaignFundsRaised: parseFloat(campaignFundStats.totalCampaignFundsRaised || 0),
        categoryBreakdown
      }
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// 2. USER MANAGEMENT
// ============================================================

// @desc List users with filters (role, status, search)
// @route GET /api/admin/users
const getAdminUsers = async (req, res) => {
  try {
    const { role = 'all', status = 'all', search = '' } = req.query;

    let sql = 'SELECT id, name, email, role, phone, status, organization_name, reward_coins, created_at FROM users WHERE 1=1';
    const params = [];

    if (role !== 'all') {
      sql += ' AND role = ?';
      params.push(role);
    }

    if (status !== 'all') {
      sql += ' AND status = ?';
      params.push(status);
    }

    if (search && search.trim() !== '') {
      sql += ' AND (name LIKE ? OR email LIKE ? OR organization_name LIKE ? OR phone LIKE ?)';
      params.push(`%${search.trim()}%`, `%${search.trim()}%`, `%${search.trim()}%`, `%${search.trim()}%`);
    }

    sql += ' ORDER BY created_at DESC';

    const users = await query(sql, params);

    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Suspend or update user account status (approved, suspended, rejected)
// @route PATCH /api/admin/users/:userId/status
const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body; // 'approved', 'suspended', 'rejected', 'pending'

    const validStatuses = ['approved', 'suspended', 'rejected', 'pending'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    const [user] = await query('SELECT id, name, role FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    await query('UPDATE users SET status = ? WHERE id = ?', [status, userId]);

    // If NGO, update verification flag accordingly
    if (user.role === 'ngo') {
      await query('UPDATE ngos SET verified_by_admin = ? WHERE user_id = ?', [status === 'approved' ? 1 : 0, userId]);
    }

    res.json({
      success: true,
      message: `Account for ${user.name} (${user.role}) has been updated to "${status}".`,
      userId,
      status
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc List pending partner verification applications
// @route GET /api/admin/verifications
const getPendingVerifications = async (req, res) => {
  try {
    const pendingUsers = await query(
      `SELECT u.id, u.name, u.email, u.role, u.phone, u.status, u.organization_name, u.created_at,
              n.registration_number, n.cause_area, n.description as ngo_description, n.city as ngo_city
       FROM users u
       LEFT JOIN ngos n ON u.id = n.user_id
       WHERE u.status = 'pending' AND u.role IN ('seller', 'ngo', 'delivery')
       ORDER BY u.created_at ASC`
    );

    res.json({
      success: true,
      count: pendingUsers.length,
      pendingPartners: pendingUsers
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Approve or reject partner account
// @route PATCH /api/admin/verifications/:userId
const verifyPartner = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be approved or rejected.' });
    }

    const users = await query('SELECT id, name, role, email FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'Partner account not found.' });
    }

    await query('UPDATE users SET status = ? WHERE id = ?', [status, userId]);

    if (users[0].role === 'ngo') {
      await query('UPDATE ngos SET verified_by_admin = ? WHERE user_id = ?', [status === 'approved' ? 1 : 0, userId]);
    }

    res.json({
      success: true,
      message: `Partner account for ${users[0].name} (${users[0].role}) has been ${status}.`,
      status
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// 3. NGO MANAGEMENT
// ============================================================

// @desc List all NGOs with active activity counts
// @route GET /api/admin/ngos
const getAdminNgos = async (req, res) => {
  try {
    const ngos = await query(`
      SELECT n.*, u.email as account_email, u.status as user_status,
             (SELECT COUNT(*) FROM ngo_requirements WHERE ngo_id = n.id AND status = 'Active') as activeRequirementsCount,
             (SELECT COUNT(*) FROM ngo_receipts WHERE ngo_id = n.id) as receiptsCount,
             (SELECT COUNT(*) FROM distribution_records WHERE ngo_id = n.id) as distributionDrivesCount,
             (SELECT COALESCE(SUM(quantity), 0) FROM ngo_inventory WHERE ngo_id = n.id) as inventoryStockUnits
      FROM ngos n
      JOIN users u ON n.user_id = u.id
      ORDER BY n.verified_by_admin DESC, n.created_at DESC
    `);

    // Parse accepted_categories if string
    for (const ngo of ngos) {
      try {
        ngo.accepted_categories = typeof ngo.accepted_categories === 'string'
          ? JSON.parse(ngo.accepted_categories)
          : (ngo.accepted_categories || []);
      } catch (e) {
        ngo.accepted_categories = [];
      }
    }

    res.json({
      success: true,
      count: ngos.length,
      ngos
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// 4. DONATION MANAGEMENT
// ============================================================

// @desc View all donations (physical items & monetary) with search & status filters
// @route GET /api/admin/donations
const getAdminDonations = async (req, res) => {
  try {
    const { type = 'all', status = 'all', search = '' } = req.query;

    let sql = `
      SELECT d.*, n.organization_name as matched_ngo_name,
             dp.vehicle_type, dp.vehicle_number, u.name as driver_name
      FROM donations d
      LEFT JOIN ngos n ON d.matched_ngo_id = n.id
      LEFT JOIN delivery_partners dp ON d.delivery_partner_id = dp.id
      LEFT JOIN users u ON dp.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (type !== 'all') {
      sql += ' AND d.donation_type = ?';
      params.push(type);
    }

    if (status !== 'all') {
      sql += ' AND d.status = ?';
      params.push(status);
    }

    if (search && search.trim() !== '') {
      sql += ' AND (d.item_name LIKE ? OR d.donation_code LIKE ? OR d.donor_name LIKE ? OR d.donor_email LIKE ?)';
      params.push(`%${search.trim()}%`, `%${search.trim()}%`, `%${search.trim()}%`, `%${search.trim()}%`);
    }

    sql += ' ORDER BY d.created_at DESC';

    const donations = await query(sql, params);

    res.json({
      success: true,
      count: donations.length,
      donations
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc View all ground distribution records with photo evidence
// @route GET /api/admin/distribution-records
const getAdminDistributionRecords = async (req, res) => {
  try {
    const records = await query(`
      SELECT dr.*, d.donation_code, d.category as item_category,
             n.organization_name as ngo_name, n.city as ngo_city
      FROM distribution_records dr
      LEFT JOIN donations d ON dr.donation_id = d.id
      LEFT JOIN ngos n ON dr.ngo_id = n.id
      ORDER BY dr.distribution_date DESC, dr.created_at DESC
    `);

    for (const r of records) {
      try {
        r.supporting_photographs = typeof r.supporting_photographs === 'string'
          ? JSON.parse(r.supporting_photographs)
          : (r.supporting_photographs || []);
      } catch (e) {
        r.supporting_photographs = [];
      }
    }

    res.json({
      success: true,
      count: records.length,
      records
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// 5. DELIVERY MANAGEMENT
// ============================================================

// @desc View all delivery partner fleet profiles
// @route GET /api/admin/delivery-partners
const getAdminDeliveryPartners = async (req, res) => {
  try {
    const partners = await query(`
      SELECT dp.*, u.name, u.email, u.phone, u.status as user_status,
             (SELECT COUNT(*) FROM delivery_assignments WHERE delivery_partner_id = dp.id AND status NOT IN ('Completed', 'Cancelled')) as activeTripsCount
      FROM delivery_partners dp
      JOIN users u ON dp.user_id = u.id
      ORDER BY dp.created_at DESC
    `);

    res.json({
      success: true,
      count: partners.length,
      partners
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Monitor all pickup requests and assignments
// @route GET /api/admin/pickup-requests
const getAdminPickupRequests = async (req, res) => {
  try {
    const requests = await query(`
      SELECT pr.*, da.assignment_code, da.status as assignment_status, da.accepted_at,
             dp.vehicle_type, dp.vehicle_number, u.name as driver_name, u.phone as driver_phone
      FROM pickup_requests pr
      LEFT JOIN delivery_assignments da ON pr.id = da.pickup_request_id
      LEFT JOIN delivery_partners dp ON da.delivery_partner_id = dp.id
      LEFT JOIN users u ON dp.user_id = u.id
      ORDER BY pr.created_at DESC
    `);

    res.json({
      success: true,
      count: requests.length,
      pickupRequests: requests
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Resolve delivery issue: reset pickup request to Pending for re-assignment
// @route POST /api/admin/pickup-requests/:id/reset
const resetPickupRequest = async (req, res) => {
  try {
    const { id } = req.params;
    await query("UPDATE pickup_requests SET status = 'Pending' WHERE id = ?", [id]);
    await query("UPDATE delivery_assignments SET status = 'Cancelled' WHERE pickup_request_id = ? AND status != 'Completed'", [id]);

    res.json({
      success: true,
      message: 'Pickup request reset to "Pending". Ready for another delivery courier to accept.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// 6. E-COMMERCE MANAGEMENT
// ============================================================

// @desc View all products for admin moderation
// @route GET /api/admin/products
const getAdminProducts = async (req, res) => {
  try {
    const products = await query(`
      SELECT p.*, c.name as category_name, u.name as seller_name, u.organization_name as seller_organization
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN users u ON p.seller_id = u.id
      ORDER BY p.created_at DESC
    `);

    res.json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Toggle product active/inactive
// @route PATCH /api/admin/products/:id/toggle
const toggleProductStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const [p] = await query('SELECT is_active, name FROM products WHERE id = ?', [id]);
    if (!p) return res.status(404).json({ success: false, message: 'Product not found.' });

    const newStatus = p.is_active ? 0 : 1;
    await query('UPDATE products SET is_active = ? WHERE id = ?', [newStatus, id]);

    res.json({
      success: true,
      message: `Product "${p.name}" is now ${newStatus ? 'Active' : 'Inactive'}.`,
      isActive: !!newStatus
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc View all orders across platform
// @route GET /api/admin/orders
const getAdminOrders = async (req, res) => {
  try {
    const orders = await query(`
      SELECT o.*, u.name as customer_name, u.email as customer_email,
             a.city, a.state, a.postal_code,
             (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as itemCount
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN addresses a ON o.address_id = a.id
      ORDER BY o.created_at DESC
    `);

    res.json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Create new product category
// @route POST /api/admin/categories
const createCategory = async (req, res) => {
  try {
    const { name, description, image_url } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required.' });
    }

    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');

    const result = await query(
      'INSERT INTO categories (name, slug, description, image_url) VALUES (?, ?, ?, ?)',
      [name.trim(), slug, description || '', image_url || '']
    );

    res.status(201).json({
      success: true,
      message: 'Category created successfully!',
      category: { id: result.insertId, name, slug, description, image_url }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// 7. COIN MANAGEMENT
// ============================================================

// @desc View all coin transactions across the platform
// @route GET /api/admin/coins/ledger
const getAdminCoinLedger = async (req, res) => {
  try {
    const transactions = await query(`
      SELECT ct.*, u.name as user_name, u.email as user_email, u.role as user_role
      FROM coin_transactions ct
      JOIN users u ON ct.user_id = u.id
      ORDER BY ct.created_at DESC
      LIMIT 100
    `);

    const [totals] = await query(`
      SELECT
        COALESCE(SUM(CASE WHEN type = 'earned' THEN coins ELSE 0 END), 0) as totalCoinsIssued,
        COALESCE(SUM(CASE WHEN type = 'redeemed' THEN coins ELSE 0 END), 0) as totalCoinsRedeemed
      FROM coin_transactions
    `);

    res.json({
      success: true,
      totals: {
        totalCoinsIssued: totals.totalCoinsIssued || 0,
        totalCoinsRedeemed: totals.totalCoinsRedeemed || 0,
        totalRupeeValueRedeemed: (totals.totalCoinsRedeemed || 0) * 1.0
      },
      count: transactions.length,
      transactions
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
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
};
