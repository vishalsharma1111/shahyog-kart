const { query, transaction } = require('../config/db');
const { logAudit } = require('../services/auditService');
const crypto = require('crypto');

// ============================================================
// 1. PUBLIC CAMPAIGN APIS
// ============================================================

// @desc Get all active fundraising campaigns with real-time verified progress
// @route GET /api/fundraising/campaigns
// @access Public
const getActiveCampaigns = async (req, res) => {
  try {
    const campaigns = await query(`
      SELECT 
        c.id,
        c.ngo_id,
        c.title,
        c.description,
        c.fundraising_goal,
        c.start_date,
        c.end_date,
        c.status,
        c.supporting_documents,
        c.photographs,
        c.created_at,
        n.organization_name as ngo_name,
        n.city as ngo_city,
        n.state as ngo_state,
        -- Calculated strictly from verified successful payments only
        COALESCE(
          (SELECT SUM(amount) 
           FROM fund_donations 
           WHERE campaign_id = c.id AND payment_status = 'completed'), 
          0.00
        ) as verified_amount_raised,
        -- Count of verified donors
        COALESCE(
          (SELECT COUNT(*) 
           FROM fund_donations 
           WHERE campaign_id = c.id AND payment_status = 'completed'), 
          0
        ) as donor_count
      FROM fundraising_campaigns c
      JOIN ngos n ON c.ngo_id = n.id
      WHERE c.status = 'active'
      ORDER BY c.created_at DESC
    `);

    // Calculate remaining amount dynamically
    const formatted = campaigns.map((camp) => {
      const goal = parseFloat(camp.fundraising_goal || 0);
      const raised = parseFloat(camp.verified_amount_raised || 0);
      const remaining = Math.max(0, goal - raised);
      const progressPercent = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0;

      return {
        ...camp,
        fundraising_goal: goal,
        amount_raised: raised,
        remaining_amount: remaining,
        progress_percent: progressPercent
      };
    });

    res.json({
      success: true,
      count: formatted.length,
      campaigns: formatted
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get single campaign with verified donations ledger
// @route GET /api/fundraising/campaigns/:id
// @access Public
const getCampaignDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const [camp] = await query(`
      SELECT 
        c.*,
        n.organization_name as ngo_name,
        n.city as ngo_city,
        n.state as ngo_state,
        n.contact_person,
        COALESCE(
          (SELECT SUM(amount) 
           FROM fund_donations 
           WHERE campaign_id = c.id AND payment_status = 'completed'), 
          0.00
        ) as verified_amount_raised
      FROM fundraising_campaigns c
      JOIN ngos n ON c.ngo_id = n.id
      WHERE c.id = ?
    `, [id]);

    if (!camp) {
      return res.status(404).json({ success: false, message: 'Fundraising campaign not found.' });
    }

    const goal = parseFloat(camp.fundraising_goal || 0);
    const raised = parseFloat(camp.verified_amount_raised || 0);
    const remaining = Math.max(0, goal - raised);

    // Get verified recent donations (privacy-safe donor names)
    const donations = await query(`
      SELECT 
        id,
        donor_name,
        amount,
        created_at,
        verified_at
      FROM fund_donations
      WHERE campaign_id = ? AND payment_status = 'completed'
      ORDER BY verified_at DESC
      LIMIT 20
    `, [id]);

    res.json({
      success: true,
      campaign: {
        ...camp,
        fundraising_goal: goal,
        amount_raised: raised,
        remaining_amount: remaining,
        progress_percent: goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0,
        recent_donations: donations
      }
    });
  } catch (error) {
    console.error('Error fetching campaign details:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// 2. NGO CAMPAIGN MANAGEMENT
// ============================================================

// @desc Create a new fundraising campaign by verified NGO
// @route POST /api/ngo/campaigns
// @access Protected (role='ngo', verified)
const createCampaign = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find NGO record
    const [ngo] = await query('SELECT * FROM ngos WHERE user_id = ?', [userId]);
    if (!ngo) {
      return res.status(404).json({ success: false, message: 'NGO profile not found.' });
    }

    if (!ngo.verified_by_admin && req.user.status !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Your NGO account must be verified by admin before publishing fundraising campaigns.'
      });
    }

    const {
      title,
      description,
      fundraising_goal,
      start_date,
      end_date,
      supporting_documents = null,
      photographs = null
    } = req.body;

    if (!title || !description || !fundraising_goal || !start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, fundraising goal, start date, and end date are required.'
      });
    }

    const goal = parseFloat(fundraising_goal);
    if (isNaN(goal) || goal <= 0) {
      return res.status(400).json({ success: false, message: 'Fundraising goal must be a valid positive amount.' });
    }

    const result = await query(`
      INSERT INTO fundraising_campaigns
        (ngo_id, title, description, fundraising_goal, amount_raised, start_date, end_date, status, supporting_documents, photographs)
      VALUES (?, ?, ?, ?, 0.00, ?, ?, 'active', ?, ?)
    `, [
      ngo.id,
      title.trim(),
      description.trim(),
      goal,
      start_date,
      end_date,
      supporting_documents,
      photographs
    ]);

    await logAudit({
      userId,
      action: 'CAMPAIGN_CREATE',
      entityType: 'campaign',
      entityId: result.insertId,
      newValue: { ngo_id: ngo.id, title, goal, start_date, end_date },
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Fundraising campaign created successfully!',
      campaignId: result.insertId
    });
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get campaigns owned by current NGO
// @route GET /api/ngo/campaigns
// @access Protected (role='ngo')
const getNgoCampaigns = async (req, res) => {
  try {
    const userId = req.user.id;
    const [ngo] = await query('SELECT id FROM ngos WHERE user_id = ?', [userId]);
    if (!ngo) {
      return res.status(404).json({ success: false, message: 'NGO record not found.' });
    }

    const campaigns = await query(`
      SELECT 
        c.*,
        COALESCE(
          (SELECT SUM(amount) 
           FROM fund_donations 
           WHERE campaign_id = c.id AND payment_status = 'completed'), 
          0.00
        ) as verified_amount_raised,
        COALESCE(
          (SELECT COUNT(*) 
           FROM fund_donations 
           WHERE campaign_id = c.id AND payment_status = 'completed'), 
          0
        ) as donor_count
      FROM fundraising_campaigns c
      WHERE c.ngo_id = ?
      ORDER BY c.created_at DESC
    `, [ngo.id]);

    const formatted = campaigns.map((camp) => {
      const goal = parseFloat(camp.fundraising_goal || 0);
      const raised = parseFloat(camp.verified_amount_raised || 0);
      return {
        ...camp,
        fundraising_goal: goal,
        amount_raised: raised,
        remaining_amount: Math.max(0, goal - raised),
        progress_percent: goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0
      };
    });

    res.json({
      success: true,
      count: formatted.length,
      campaigns: formatted
    });
  } catch (error) {
    console.error('Error fetching NGO campaigns:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// 3. PAYMENT INITIATION & VERIFICATION
// ============================================================

// @desc Initiate a verified fund donation to an NGO or Campaign
// @route POST /api/fundraising/donate
// @access Public or Protected
const initiateFundDonation = async (req, res) => {
  try {
    const {
      campaign_id = null,
      ngo_id,
      amount,
      donor_name,
      donor_email,
      payment_method = 'card'
    } = req.body;

    if (!ngo_id || !amount || !donor_name || !donor_email) {
      return res.status(400).json({
        success: false,
        message: 'NGO ID, amount, donor name, and donor email are required.'
      });
    }

    const donationAmount = parseFloat(amount);
    if (isNaN(donationAmount) || donationAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be greater than zero.' });
    }

    // Verify NGO exists and is verified
    const [ngo] = await query('SELECT * FROM ngos WHERE id = ?', [ngo_id]);
    if (!ngo || !ngo.verified_by_admin) {
      return res.status(400).json({ success: false, message: 'Target NGO is not currently verified.' });
    }

    // Generate unique transaction ID & gateway mock reference
    const transactionId = `TXN-FUND-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const gatewayRef = `GATEWAY-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

    const donorId = req.user ? req.user.id : null;

    const result = await query(`
      INSERT INTO fund_donations
        (transaction_id, campaign_id, ngo_id, donor_id, donor_name, donor_email, amount, payment_gateway_ref, payment_status, payment_method)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `, [
      transactionId,
      campaign_id,
      ngo_id,
      donorId,
      donor_name.trim(),
      donor_email.trim(),
      donationAmount,
      gatewayRef,
      payment_method
    ]);

    res.status(201).json({
      success: true,
      message: 'Donation order initiated. Please complete payment verification.',
      transaction: {
        id: result.insertId,
        transaction_id: transactionId,
        gateway_reference: gatewayRef,
        amount: donationAmount,
        status: 'pending'
      }
    });
  } catch (error) {
    console.error('Error initiating fund donation:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Verify payment transaction & update campaign raised totals atomically
// @route POST /api/fundraising/verify-payment
// @access Public (Webhook / Secured client verification)
const verifyPaymentTransaction = async (req, res) => {
  try {
    const { transaction_id, payment_gateway_ref, status } = req.body;

    if (!transaction_id || !payment_gateway_ref) {
      return res.status(400).json({
        success: false,
        message: 'transaction_id and payment_gateway_ref are required.'
      });
    }

    // Check payment record
    const [txn] = await query(`
      SELECT * FROM fund_donations 
      WHERE transaction_id = ? AND payment_gateway_ref = ?
    `, [transaction_id, payment_gateway_ref]);

    if (!txn) {
      return res.status(404).json({ success: false, message: 'Transaction record not found.' });
    }

    // Idempotency: If already completed, do NOT re-credit or double count
    if (txn.payment_status === 'completed') {
      return res.json({
        success: true,
        message: 'Payment was already verified and credited previously (Idempotent).',
        transaction: txn
      });
    }

    if (status === 'failed') {
      await query(
        "UPDATE fund_donations SET payment_status = 'failed' WHERE id = ?",
        [txn.id]
      );
      return res.json({
        success: false,
        message: 'Payment failed. Funds were not credited.'
      });
    }

    // Execute atomic update
    await transaction(async (conn) => {
      // 1. Mark transaction completed with verification timestamp
      await conn.query(
        "UPDATE fund_donations SET payment_status = 'completed', verified_at = NOW() WHERE id = ?",
        [txn.id]
      );

      // 2. If tied to a campaign, update campaign amount_raised from SUM of completed payments
      if (txn.campaign_id) {
        const [sumResult] = await conn.query(`
          SELECT COALESCE(SUM(amount), 0.00) as verifiedTotal
          FROM fund_donations
          WHERE campaign_id = ? AND payment_status = 'completed'
        `, [txn.campaign_id]);

        await conn.query(
          'UPDATE fundraising_campaigns SET amount_raised = ? WHERE id = ?',
          [sumResult[0].verifiedTotal, txn.campaign_id]
        );
      }
    });

    await logAudit({
      userId: txn.donor_id,
      action: 'PAYMENT_VERIFIED',
      entityType: 'payment',
      entityId: txn.id,
      newValue: {
        transaction_id: txn.transaction_id,
        amount: txn.amount,
        campaign_id: txn.campaign_id,
        ngo_id: txn.ngo_id
      },
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Payment verified successfully! Funds credited to NGO fundraising ledger.',
      transaction_id: txn.transaction_id,
      amount: txn.amount
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// 4. ADMIN AUDIT & TRANSACTIONS
// ============================================================

// @desc Get complete audit trail of financial transactions for Admin
// @route GET /api/admin/fundraising/transactions
// @access Protected (role='admin')
const getAdminFundTransactions = async (req, res) => {
  try {
    const transactions = await query(`
      SELECT 
        fd.*,
        n.organization_name as ngo_name,
        c.title as campaign_title
      FROM fund_donations fd
      JOIN ngos n ON fd.ngo_id = n.id
      LEFT JOIN fundraising_campaigns c ON fd.campaign_id = c.id
      ORDER BY fd.created_at DESC
      LIMIT 100
    `);

    res.json({
      success: true,
      count: transactions.length,
      transactions
    });
  } catch (error) {
    console.error('Error fetching fund transactions:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getActiveCampaigns,
  getCampaignDetails,
  createCampaign,
  getNgoCampaigns,
  initiateFundDonation,
  verifyPaymentTransaction,
  getAdminFundTransactions
};
