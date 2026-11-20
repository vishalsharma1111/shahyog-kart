const { query } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// @desc Get all verified NGOs / Causes
// @route GET /api/donations/ngos
const getNgos = async (req, res) => {
  try {
    const { cause } = req.query;

    let sql = `
      SELECT n.*, u.name as contact_person, u.email as contact_email
      FROM ngos n
      LEFT JOIN users u ON n.user_id = u.id
      WHERE n.verified_by_admin = 1
    `;
    const params = [];

    if (cause && cause !== 'all') {
      sql += ` AND n.cause_area = ?`;
      params.push(cause);
    }

    sql += ` ORDER BY n.raised_amount DESC`;

    const ngos = await query(sql, params);

    res.json({
      success: true,
      ngos
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get single NGO profile
// @route GET /api/donations/ngos/:id
const getNgoById = async (req, res) => {
  try {
    const { id } = req.params;

    const ngos = await query(
      `SELECT n.*, u.name as contact_person, u.email as contact_email, u.phone as contact_phone
       FROM ngos n
       LEFT JOIN users u ON n.user_id = u.id
       WHERE n.id = ?`,
      [id]
    );

    if (ngos.length === 0) {
      return res.status(404).json({ success: false, message: 'NGO not found.' });
    }

    // Fetch recent donations to this NGO
    const recentDonations = await query(
      `SELECT donor_name, amount, message, created_at
       FROM donations
       WHERE ngo_id = ? AND payment_status = 'completed'
       ORDER BY created_at DESC
       LIMIT 6`,
      [id]
    );

    res.json({
      success: true,
      ngo: ngos[0],
      recentDonations
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Create a new direct donation
// @route POST /api/donations
const createDonation = async (req, res) => {
  try {
    const { ngo_id, cause_title, amount, donor_name, donor_email, message, payment_method = 'upi' } = req.body;

    const donationAmount = parseFloat(amount);
    if (isNaN(donationAmount) || donationAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Please specify a valid donation amount.' });
    }

    if (!donor_name || !donor_email) {
      return res.status(400).json({ success: false, message: 'Donor name and email are required.' });
    }

    const donorId = req.user ? req.user.id : null;
    const transactionId = `DON-${uuidv4().substring(0, 16).toUpperCase()}`;

    // Insert donation record
    const result = await query(
      `INSERT INTO donations (donor_id, ngo_id, donor_name, donor_email, cause_title, amount, payment_method, payment_status, message, transaction_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?)`,
      [
        donorId,
        ngo_id || null,
        donor_name.trim(),
        donor_email.toLowerCase().trim(),
        cause_title || 'General Social Welfare Fund',
        donationAmount,
        payment_method,
        message || null,
        transactionId
      ]
    );

    // If donated to specific NGO, increment raised_amount
    if (ngo_id) {
      await query('UPDATE ngos SET raised_amount = raised_amount + ? WHERE id = ?', [donationAmount, ngo_id]);
    }

    res.status(201).json({
      success: true,
      message: 'Thank you for your generous contribution! Your impact receipt has been generated.',
      donation: {
        id: result.insertId,
        donor_name,
        donor_email,
        cause_title: cause_title || 'General Social Welfare Fund',
        amount: donationAmount,
        transaction_id: transactionId,
        payment_status: 'completed',
        created_at: new Date()
      }
    });
  } catch (error) {
    console.error('Donation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get current user's personal donation history
// @route GET /api/donations/my
const getMyDonations = async (req, res) => {
  try {
    const donations = await query(
      `SELECT d.*, n.organization_name as ngo_name
       FROM donations d
       LEFT JOIN ngos n ON d.ngo_id = n.id
       WHERE d.donor_id = ? OR d.donor_email = ?
       ORDER BY d.created_at DESC`,
      [req.user.id, req.user.email]
    );

    res.json({
      success: true,
      donations
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getNgos,
  getNgoById,
  createDonation,
  getMyDonations
};
