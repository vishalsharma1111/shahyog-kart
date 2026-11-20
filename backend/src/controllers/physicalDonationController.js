const { query, transaction } = require('../config/db');
const { matchNgosForDonation } = require('../services/matchingService');
const { v4: uuidv4 } = require('uuid');
const notificationService = require('../services/notificationService');

const VALID_CATEGORIES = [
  'Books',
  'Clothes',
  'Shoes',
  'Food',
  'Stationery',
  'Toys',
  'Blankets',
  'Household essentials'
];

const VALID_STATUSES = [
  'Submitted',
  'Under Review',
  'Approved',
  'NGO Matched',
  'NGO Accepted',
  'Pickup Assigned',
  'Collected',
  'Received by NGO',
  'Distributed to beneficiaries',
  'Completed',
  'Rejected'
];

// Helper to generate Unique Donation ID
function generateDonationCode() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `SK-DON-${dateStr}-${rand}`;
}

// @desc Submit a new physical item donation
// @route POST /api/donations/items
const createItemDonation = async (req, res) => {
  try {
    const {
      item_name,
      category,
      description,
      quantity = 1,
      condition_type = 'Good',
      images = [],
      pickup_address,
      pickup_city = 'New Delhi',
      pickup_state = 'Delhi',
      pickup_pincode = '110001',
      latitude,
      longitude,
      donor_name,
      donor_email
    } = req.body;

    if (!item_name || !category) {
      return res.status(400).json({ success: false, message: 'Item name and category are required.' });
    }

    const matchedCategory = VALID_CATEGORIES.find(
      (c) => c.toLowerCase() === category.trim().toLowerCase()
    );

    if (!matchedCategory) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`
      });
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be at least 1.' });
    }

    const donorId = req.user ? req.user.id : null;
    const resolvedDonorName = donor_name || req.user?.name || 'Anonymous Donor';
    const resolvedDonorEmail = donor_email || req.user?.email || 'donor@shahyogkart.com';
    const donationCode = generateDonationCode();

    // Default Delhi coordinates if not supplied
    const lat = latitude ? parseFloat(latitude) : 28.6139;
    const lng = longitude ? parseFloat(longitude) : 77.2090;

    // Insert donation record
    const result = await query(
      `INSERT INTO donations (
        donation_code, donation_type, donor_id, donor_name, donor_email,
        item_name, category, description, quantity, condition_type,
        pickup_address, pickup_city, pickup_state, pickup_pincode,
        latitude, longitude, status, transaction_id, cause_title
      ) VALUES (?, 'item', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Submitted', ?, ?)`,
      [
        donationCode,
        donorId,
        resolvedDonorName,
        resolvedDonorEmail,
        item_name.trim(),
        matchedCategory,
        description || '',
        qty,
        condition_type,
        pickup_address || '',
        pickup_city,
        pickup_state,
        pickup_pincode,
        lat,
        lng,
        `TXN-ITEM-${uuidv4().substring(0, 12).toUpperCase()}`,
        `Physical Donation: ${item_name.trim()}`
      ]
    );

    const donationId = result.insertId;

    // Handle donation images
    if (Array.isArray(images) && images.length > 0) {
      for (const imgUrl of images) {
        if (imgUrl && typeof imgUrl === 'string') {
          await query(
            'INSERT INTO donation_images (donation_id, image_url) VALUES (?, ?)',
            [donationId, imgUrl.trim()]
          );
        }
      }
    } else if (req.file) {
      await query(
        'INSERT INTO donation_images (donation_id, image_url) VALUES (?, ?)',
        [donationId, `/uploads/${req.file.filename}`]
      );
    }

    // Run Smart NGO Matching immediately
    const donationRecord = {
      id: donationId,
      category,
      quantity: qty,
      latitude: lat,
      longitude: lng,
      item_name
    };

    const recommendedNgos = await matchNgosForDonation(donationRecord);

    // Persist calculated matching scores for transparency
    for (const match of recommendedNgos) {
      await query(
        `INSERT INTO matching_scores (
          donation_id, ngo_id, final_score, category_weight_score, location_weight_score,
          quantity_weight_score, urgency_weight_score, distance_km, match_reasons
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          donationId,
          match.ngo_id,
          match.final_score,
          match.scores_breakdown.category_weighted,
          match.scores_breakdown.location_weighted,
          match.scores_breakdown.quantity_weighted,
          match.scores_breakdown.urgency_weighted,
          match.distance_km,
          JSON.stringify(match.match_reasons)
        ]
      );
    }

    // Fetch full saved donation
    const [saved] = await query('SELECT * FROM donations WHERE id = ?', [donationId]);
    const savedImages = await query('SELECT image_url FROM donation_images WHERE donation_id = ?', [donationId]);

    // Dispatch real-time notification to donor and admins
    if (donorId) {
      notificationService.notify(
        donorId,
        'Donation Submitted Successfully! 📦',
        `Your physical item donation for "${item_name}" (${qty} units) has been recorded (Code: ${donationCode}).`,
        'donation',
        donationId,
        'donation'
      );
    }
    notificationService.notifyAdmins(
      'New Physical Donation Registered',
      `Donor submitted ${qty}x ${item_name} (${category}) in ${pickup_city}.`,
      'donation',
      donationId,
      'donation'
    );

    res.status(201).json({
      success: true,
      message: `Donation submitted successfully with ID ${donationCode}!`,
      donation: {
        ...saved,
        images: savedImages.map(img => img.image_url)
      },
      recommendedNgos: recommendedNgos.slice(0, 5) // Return top 5 matched NGOs
    });
  } catch (error) {
    console.error('Error creating physical donation:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get current user's submitted physical donations
// @route GET /api/donations/items/my
const getMyItemDonations = async (req, res) => {
  try {
    const donorId = req.user.id;
    const donations = await query(
      `SELECT d.*, n.organization_name as matched_ngo_name, n.phone as matched_ngo_phone
       FROM donations d
       LEFT JOIN ngos n ON d.matched_ngo_id = n.id
       WHERE d.donation_type = 'item' AND (d.donor_id = ? OR d.donor_email = ?)
       ORDER BY d.created_at DESC`,
      [donorId, req.user.email]
    );

    // Attach images
    for (const don of donations) {
      const images = await query('SELECT image_url FROM donation_images WHERE donation_id = ?', [don.id]);
      don.images = images.map(img => img.image_url);
    }

    res.json({
      success: true,
      donations
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get detailed physical donation tracking info
// @route GET /api/donations/items/:identifier
const getItemDonationDetails = async (req, res) => {
  try {
    const { identifier } = req.params;

    const donations = await query(
      `SELECT d.*, n.organization_name as matched_ngo_name, n.contact_person as matched_ngo_contact,
              n.phone as matched_ngo_phone, n.address as matched_ngo_address, n.city as matched_ngo_city
       FROM donations d
       LEFT JOIN ngos n ON d.matched_ngo_id = n.id
       WHERE d.donation_type = 'item' AND (d.id = ? OR d.donation_code = ?)`,
      [identifier, identifier]
    );

    if (donations.length === 0) {
      return res.status(404).json({ success: false, message: 'Donation tracking record not found.' });
    }

    const donation = donations[0];
    const images = await query('SELECT image_url FROM donation_images WHERE donation_id = ?', [donation.id]);
    donation.images = images.map(img => img.image_url);

    // Fetch official receipt if received
    const receipts = await query('SELECT * FROM ngo_receipts WHERE donation_id = ?', [donation.id]);
    donation.receipt = receipts[0] || null;

    // Fetch matching scores / matches
    const matches = await query(
      `SELECT ms.*, n.organization_name, n.cause_area, n.city, n.state
       FROM matching_scores ms
       JOIN ngos n ON ms.ngo_id = n.id
       WHERE ms.donation_id = ?
       ORDER BY ms.final_score DESC`,
      [donation.id]
    );

    donation.allMatches = matches.map(m => ({
      ...m,
      match_reasons: typeof m.match_reasons === 'string' ? JSON.parse(m.match_reasons) : m.match_reasons
    }));

    // Fetch delivery partner info & tracking logs
    const [deliveryInfo] = await query(
      `SELECT da.*, dp.vehicle_type, dp.vehicle_number, u.name as driver_name, u.phone as driver_phone
       FROM delivery_assignments da
       JOIN delivery_partners dp ON da.delivery_partner_id = dp.id
       JOIN users u ON dp.user_id = u.id
       WHERE da.donation_id = ?
       ORDER BY da.id DESC LIMIT 1`,
      [donation.id]
    );
    donation.delivery = deliveryInfo || null;

    if (donation.delivery) {
      const trackingLogs = await query(
        'SELECT * FROM delivery_tracking WHERE donation_id = ? ORDER BY created_at ASC',
        [donation.id]
      );
      donation.deliveryLogs = trackingLogs;
    }

    // Fetch distribution records with photos
    const [distributionRec] = await query(
      'SELECT * FROM distribution_records WHERE donation_id = ? ORDER BY id DESC LIMIT 1',
      [donation.id]
    );
    if (distributionRec) {
      try {
        distributionRec.supporting_photographs = typeof distributionRec.supporting_photographs === 'string'
          ? JSON.parse(distributionRec.supporting_photographs)
          : (distributionRec.supporting_photographs || []);
      } catch (e) {
        distributionRec.supporting_photographs = [];
      }
      donation.distributionRecord = distributionRec;
    }

    // Fetch coins awarded
    const [coinTxn] = await query(
      "SELECT coins, transaction_code FROM coin_transactions WHERE reference_type = 'donation' AND reference_id = ? LIMIT 1",
      [donation.id]
    );
    donation.coinTxn = coinTxn || null;

    // Status Timeline definition (Maps 'Distributed' to 'Distributed to beneficiaries')
    const currentCanonicalStatus = donation.status === 'Distributed' ? 'Distributed to beneficiaries' : donation.status;
    const trackingStatuses = VALID_STATUSES.map(s => {
      const currentIndex = VALID_STATUSES.indexOf(currentCanonicalStatus);
      const thisIndex = VALID_STATUSES.indexOf(s);
      let state = 'upcoming';
      if (currentCanonicalStatus === 'Rejected') {
        state = s === 'Rejected' ? 'cancelled' : 'upcoming';
      } else if (thisIndex < currentIndex) {
        state = 'completed';
      } else if (thisIndex === currentIndex) {
        state = 'current';
      }
      return { status: s, state };
    });

    donation.trackingTimeline = trackingStatuses;

    res.json({
      success: true,
      donation
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get smart matching recommendations for a donation
// @route GET /api/donations/items/:id/matches
const getDonationMatches = async (req, res) => {
  try {
    const { id } = req.params;
    const donations = await query('SELECT * FROM donations WHERE id = ?', [id]);
    if (donations.length === 0) {
      return res.status(404).json({ success: false, message: 'Donation not found.' });
    }

    const matches = await matchNgosForDonation(donations[0]);

    res.json({
      success: true,
      donation: donations[0],
      matches,
      recommendations: matches
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Offer donation to selected NGO
// @route POST /api/donations/items/:id/offer
const offerDonationToNgo = async (req, res) => {
  try {
    const { id } = req.params;
    const ngoId = req.body.ngoId || req.body.ngo_id;
    const requirementId = req.body.requirementId || req.body.requirement_id;

    if (!ngoId) {
      return res.status(400).json({ success: false, message: 'NGO ID is required.' });
    }

    const [donation] = await query('SELECT * FROM donations WHERE id = ?', [id]);
    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found.' });
    }

    const [ngo] = await query('SELECT * FROM ngos WHERE id = ?', [ngoId]);
    if (!ngo) {
      return res.status(404).json({ success: false, message: 'NGO not found.' });
    }

    // Insert offer in donation_matching
    const matchResult = await query(
      `INSERT INTO donation_matching (donation_id, ngo_id, requirement_id, status)
       VALUES (?, ?, ?, 'Offered')`,
      [id, ngoId, requirementId || null]
    );

    // Update donation status to 'NGO Matched'
    await query(
      `UPDATE donations SET status = 'NGO Matched', matched_ngo_id = ? WHERE id = ?`,
      [ngoId, id]
    );

    // Notify Donor and NGO
    if (donation.donor_id) {
      notificationService.notify(
        donation.donor_id,
        'Donation Offer Dispatched',
        `Your donation was offered to ${ngo.organization_name}. Awaiting partner acceptance.`,
        'donation',
        id,
        'donation'
      );
    }
    if (ngo.user_id) {
      notificationService.notify(
        ngo.user_id,
        'New Donation Offer Arrived! 🤝',
        `A donor has offered ${donation.quantity}x ${donation.item_name} to your organization. Review and accept now.`,
        'donation',
        id,
        'donation'
      );
    }

    res.json({
      success: true,
      message: `Donation offered to ${ngo.organization_name}! Status updated to 'NGO Matched'.`,
      status: 'NGO Matched',
      ngoName: ngo.organization_name,
      matching: { id: matchResult.insertId }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Update donation status along the 11 tracking stages
// @route PATCH /api/donations/items/:id/status
const updateDonationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejection_reason } = req.body;

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`
      });
    }

    await query(
      `UPDATE donations
       SET status = ?, rejection_reason = COALESCE(?, rejection_reason)
       WHERE id = ?`,
      [status, rejection_reason || null, id]
    );

    res.json({
      success: true,
      message: `Donation status updated to '${status}'.`,
      status
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc List all physical item donations (Admin / Partner inspection)
// @route GET /api/donations/items
const getAllItemDonations = async (req, res) => {
  try {
    const { status = 'all', category = 'all', search = '' } = req.query;

    let sql = `
      SELECT d.*, n.organization_name as matched_ngo_name
      FROM donations d
      LEFT JOIN ngos n ON d.matched_ngo_id = n.id
      WHERE d.donation_type = 'item'
    `;
    const params = [];

    if (status !== 'all') {
      sql += ` AND d.status = ?`;
      params.push(status);
    }

    if (category !== 'all') {
      sql += ` AND d.category = ?`;
      params.push(category);
    }

    if (search && search.trim() !== '') {
      sql += ` AND (d.item_name LIKE ? OR d.donation_code LIKE ? OR d.donor_name LIKE ?)`;
      params.push(`%${search.trim()}%`, `%${search.trim()}%`, `%${search.trim()}%`);
    }

    sql += ` ORDER BY d.created_at DESC`;

    const donations = await query(sql, params);

    res.json({
      success: true,
      donations
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createItemDonation,
  getMyItemDonations,
  getItemDonationDetails,
  getDonationMatches,
  offerDonationToNgo,
  updateDonationStatus,
  getAllItemDonations,
  VALID_CATEGORIES,
  VALID_STATUSES
};
