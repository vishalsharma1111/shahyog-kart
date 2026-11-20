const { query, transaction } = require('../config/db');
const deliveryService = require('../services/deliveryService');
const coinService = require('../services/coinService');
const notificationService = require('../services/notificationService');

// Helper to resolve NGO id from authenticated user
const getNgoIdForUser = async (userId) => {
  const [ngo] = await query('SELECT id, organization_name FROM ngos WHERE user_id = ?', [userId]);
  if (!ngo) {
    // If user is admin or linked, check first NGO as fallback or return null
    const [fallback] = await query('SELECT id, organization_name FROM ngos LIMIT 1');
    return fallback ? fallback.id : null;
  }
  return ngo.id;
};

// @desc Get comprehensive NGO dashboard metrics
// @route GET /api/ngo/overview
const getNgoDashboardOverview = async (req, res) => {
  try {
    const ngoId = await getNgoIdForUser(req.user.id);
    if (!ngoId) {
      return res.status(404).json({ success: false, message: 'NGO organization record not linked to this user.' });
    }

    const [ngo] = await query('SELECT * FROM ngos WHERE id = ?', [ngoId]);

    // Active Requirements
    const [reqStats] = await query(`
      SELECT
        COUNT(*) as totalRequirements,
        SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as activeRequirements,
        COALESCE(SUM(required_quantity), 0) as totalRequiredUnits,
        COALESCE(SUM(received_quantity), 0) as totalReceivedUnits,
        COALESCE(SUM(remaining_quantity), 0) as totalRemainingUnits
      FROM ngo_requirements
      WHERE ngo_id = ?
    `, [ngoId]);

    // Incoming offers (status: 'NGO Matched')
    const incomingOffers = await query(`
      SELECT d.*, dm.id as matching_id, dm.matching_score, dm.offered_at
      FROM donation_matching dm
      JOIN donations d ON dm.donation_id = d.id
      WHERE dm.ngo_id = ? AND dm.status = 'Offered' AND d.status = 'NGO Matched'
      ORDER BY dm.offered_at DESC
    `, [ngoId]);

    // Accepted and Received donations
    const [acceptedStats] = await query(`
      SELECT
        COUNT(*) as totalAcceptedDonations,
        SUM(CASE WHEN status IN ('Received by NGO', 'Distributed', 'Completed') THEN 1 ELSE 0 END) as totalReceivedDonations,
        COALESCE(SUM(quantity), 0) as totalItemsCount
      FROM donations
      WHERE matched_ngo_id = ? AND status IN ('NGO Accepted', 'Pickup Assigned', 'Collected', 'Received by NGO', 'Distributed', 'Completed')
    `, [ngoId]);

    // Inventory status
    const [invStats] = await query(`
      SELECT
        COALESCE(SUM(quantity), 0) as totalStockQuantity,
        COALESCE(SUM(distributed_quantity), 0) as totalDistributedQuantity,
        COALESCE(SUM(available_quantity), 0) as totalAvailableQuantity
      FROM ngo_inventory
      WHERE ngo_id = ?
    `, [ngoId]);

    // Total beneficiaries impacted from distributions
    const [distStats] = await query(`
      SELECT COUNT(*) as distributionDrives,
             COALESCE(SUM(quantity_distributed), 0) as totalDistributedUnits
      FROM ngo_distributions
      WHERE ngo_id = ?
    `, [ngoId]);

    // Real-time Verified Fundraising and Funds Received
    const [fundStats] = await query(`
      SELECT 
        (SELECT COUNT(*) FROM fundraising_campaigns WHERE ngo_id = ?) as totalCampaigns,
        (SELECT COALESCE(SUM(amount), 0.00) FROM fund_donations WHERE ngo_id = ? AND payment_status = 'completed') as verifiedFundsReceived
    `, [ngoId, ngoId]);

    res.json({
      success: true,
      ngo,
      metrics: {
        totalRequirements: reqStats.totalRequirements || 0,
        activeRequirements: reqStats.activeRequirements || 0,
        totalRequiredUnits: reqStats.totalRequiredUnits || 0,
        totalReceivedUnits: reqStats.totalReceivedUnits || 0,
        totalRemainingUnits: reqStats.totalRemainingUnits || 0,
        incomingOffersCount: incomingOffers.length,
        totalAcceptedDonations: acceptedStats.totalAcceptedDonations || 0,
        totalReceivedDonations: acceptedStats.totalReceivedDonations || 0,
        inventoryInStock: invStats.totalAvailableQuantity || 0,
        totalDistributedUnits: distStats.totalDistributedUnits || 0,
        distributionDrives: distStats.distributionDrives || 0,
        totalCampaigns: fundStats.totalCampaigns || 0,
        verifiedFundsReceived: parseFloat(fundStats.verifiedFundsReceived || 0)
      },
      incomingOffers: incomingOffers.slice(0, 5)
    });
  } catch (error) {
    console.error('Error fetching NGO dashboard overview:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get current NGO profile & settings
// @route GET /api/ngo/profile
const getNgoProfile = async (req, res) => {
  try {
    const ngoId = await getNgoIdForUser(req.user.id);
    if (!ngoId) {
      return res.status(404).json({ success: false, message: 'NGO record not found.' });
    }

    const [ngo] = await query('SELECT * FROM ngos WHERE id = ?', [ngoId]);

    // Parse JSON accepted categories if needed
    if (ngo && typeof ngo.accepted_categories === 'string') {
      try {
        ngo.accepted_categories = JSON.parse(ngo.accepted_categories);
      } catch (e) {}
    }

    res.json({
      success: true,
      ngo
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Update NGO organization profile
// @route PUT /api/ngo/profile
const updateNgoProfile = async (req, res) => {
  try {
    const ngoId = await getNgoIdForUser(req.user.id);
    const {
      organization_name,
      contact_person,
      phone,
      address,
      city,
      state,
      latitude,
      longitude,
      accepted_categories,
      description,
      website,
      capacity_limit
    } = req.body;

    const categoriesJson = Array.isArray(accepted_categories)
      ? JSON.stringify(accepted_categories)
      : typeof accepted_categories === 'string'
      ? accepted_categories
      : null;

    await query(
      `UPDATE ngos
       SET organization_name = COALESCE(?, organization_name),
           contact_person = COALESCE(?, contact_person),
           phone = COALESCE(?, phone),
           address = COALESCE(?, address),
           city = COALESCE(?, city),
           state = COALESCE(?, state),
           latitude = COALESCE(?, latitude),
           longitude = COALESCE(?, longitude),
           accepted_categories = COALESCE(?, accepted_categories),
           description = COALESCE(?, description),
           website = COALESCE(?, website),
           capacity_limit = COALESCE(?, capacity_limit)
       WHERE id = ?`,
      [
        organization_name,
        contact_person,
        phone,
        address,
        city,
        state,
        latitude ? parseFloat(latitude) : null,
        longitude ? parseFloat(longitude) : null,
        categoriesJson,
        description,
        website,
        capacity_limit ? parseInt(capacity_limit, 10) : null,
        ngoId
      ]
    );

    const [updated] = await query('SELECT * FROM ngos WHERE id = ?', [ngoId]);

    res.json({
      success: true,
      message: 'NGO profile updated successfully!',
      ngo: updated
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// NGO REQUIREMENTS MANAGEMENT
// ============================================================

// @desc Get requirements published by current NGO
// @route GET /api/ngo/requirements
const getNgoRequirements = async (req, res) => {
  try {
    const ngoId = await getNgoIdForUser(req.user.id);
    const { status = 'all', category = 'all' } = req.query;

    let sql = 'SELECT * FROM ngo_requirements WHERE ngo_id = ?';
    const params = [ngoId];

    if (status !== 'all') {
      sql += ' AND status = ?';
      params.push(status);
    }
    if (category !== 'all') {
      sql += ' AND item_category = ?';
      params.push(category);
    }

    sql += ' ORDER BY FIELD(priority, "Urgent", "High", "Medium", "Low"), created_at DESC';

    const requirements = await query(sql, params);

    res.json({
      success: true,
      requirements
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Publish a new NGO item requirement
// @route POST /api/ngo/requirements
const createNgoRequirement = async (req, res) => {
  try {
    const ngoId = await getNgoIdForUser(req.user.id);
    const { item_category, item_name, required_quantity, priority = 'Medium', description, required_date } = req.body;

    if (!item_category || !item_name || !required_quantity) {
      return res.status(400).json({
        success: false,
        message: 'Please provide item category, item name, and required quantity.'
      });
    }

    const qty = parseInt(required_quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ success: false, message: 'Required quantity must be a positive number.' });
    }

    const result = await query(
      `INSERT INTO ngo_requirements (
        ngo_id, item_category, item_name, required_quantity, received_quantity, priority, description, required_date, status
      ) VALUES (?, ?, ?, ?, 0, ?, ?, ?, 'Active')`,
      [ngoId, item_category, item_name.trim(), qty, priority, description || '', required_date || null]
    );

    const [newReq] = await query('SELECT * FROM ngo_requirements WHERE id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'NGO requirement published successfully!',
      requirement: newReq
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Update an existing requirement
// @route PUT /api/ngo/requirements/:id
const updateNgoRequirement = async (req, res) => {
  try {
    const ngoId = await getNgoIdForUser(req.user.id);
    const { id } = req.params;
    const { item_category, item_name, required_quantity, priority, description, required_date, status } = req.body;

    const [existing] = await query('SELECT id FROM ngo_requirements WHERE id = ? AND ngo_id = ?', [id, ngoId]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Requirement not found or unauthorized.' });
    }

    await query(
      `UPDATE ngo_requirements
       SET item_category = COALESCE(?, item_category),
           item_name = COALESCE(?, item_name),
           required_quantity = COALESCE(?, required_quantity),
           priority = COALESCE(?, priority),
           description = COALESCE(?, description),
           required_date = COALESCE(?, required_date),
           status = COALESCE(?, status)
       WHERE id = ? AND ngo_id = ?`,
      [
        item_category,
        item_name ? item_name.trim() : null,
        required_quantity ? parseInt(required_quantity, 10) : null,
        priority,
        description,
        required_date,
        status,
        id,
        ngoId
      ]
    );

    const [updated] = await query('SELECT * FROM ngo_requirements WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Requirement updated successfully!',
      requirement: updated
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Delete / Close a requirement
// @route DELETE /api/ngo/requirements/:id
const deleteNgoRequirement = async (req, res) => {
  try {
    const ngoId = await getNgoIdForUser(req.user.id);
    const { id } = req.params;

    await query('DELETE FROM ngo_requirements WHERE id = ? AND ngo_id = ?', [id, ngoId]);

    res.json({
      success: true,
      message: 'Requirement removed successfully.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// INCOMING DONATIONS & ACCEPTANCE
// ============================================================

// @desc Get incoming donation offers for this NGO
// @route GET /api/ngo/incoming-donations
const getIncomingDonations = async (req, res) => {
  try {
    const ngoId = await getNgoIdForUser(req.user.id);

    const offers = await query(`
      SELECT d.*, dm.id as matching_id, dm.matching_score, dm.status as offer_status, dm.offered_at,
             nr.item_name as requirement_name, nr.priority as requirement_priority
      FROM donation_matching dm
      JOIN donations d ON dm.donation_id = d.id
      LEFT JOIN ngo_requirements nr ON dm.requirement_id = nr.id
      WHERE dm.ngo_id = ?
      ORDER BY dm.offered_at DESC
    `, [ngoId]);

    // Attach images
    for (const off of offers) {
      const images = await query('SELECT image_url FROM donation_images WHERE donation_id = ?', [off.id]);
      off.images = images.map(img => img.image_url);
    }

    res.json({
      success: true,
      offers
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Accept or reject an offered donation
// @route POST /api/ngo/donations/:donationId/respond
const respondToDonationOffer = async (req, res) => {
  try {
    const ngoId = await getNgoIdForUser(req.user.id);
    const { donationId } = req.params;
    const decision = req.body.decision || req.body.action; // 'accept' or 'reject'
    const rejection_reason = req.body.rejection_reason || req.body.reason;

    if (!['accept', 'reject'].includes(decision)) {
      return res.status(400).json({ success: false, message: 'Decision must be accept or reject.' });
    }

    const [donation] = await query('SELECT * FROM donations WHERE id = ?', [donationId]);
    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found.' });
    }

    if (decision === 'accept') {
      // 1. Update donation matching
      await query(
        `UPDATE donation_matching
         SET status = 'Accepted', responded_at = NOW()
         WHERE donation_id = ? AND ngo_id = ?`,
        [donationId, ngoId]
      );

      // 2. Update donation status to 'NGO Accepted'
      await query(
        `UPDATE donations
         SET status = 'NGO Accepted', matched_ngo_id = ?
         WHERE id = ?`,
        [ngoId, donationId]
      );

      // 3. Automatically create pickup request for delivery partners
      let pickupRequest = null;
      try {
        pickupRequest = await deliveryService.createPickupRequest(donationId, ngoId);
      } catch (pickupErr) {
        console.error('Pickup request creation warning:', pickupErr.message);
      }

      // Notify Donor of Acceptance
      if (donation.donor_id) {
        notificationService.notify(
          donation.donor_id,
          'Donation Accepted by NGO! 🎉',
          `The NGO has accepted your donation offer! A doorstep pickup request has been dispatched to our courier fleet.`,
          'donation',
          donationId,
          'donation'
        );
      }

      res.json({
        success: true,
        message: 'Donation offer accepted! Status updated to "NGO Accepted". Pickup logistics request generated.',
        status: 'NGO Accepted',
        pickupRequest
      });
    } else {
      // Rejected:
      // 1. Update matching record
      await query(
        `UPDATE donation_matching
         SET status = 'Rejected', rejection_reason = ?, responded_at = NOW()
         WHERE donation_id = ? AND ngo_id = ?`,
        [rejection_reason || 'Not aligned with current facility capacity', donationId, ngoId]
      );

      // 2. Reset donation to 'Approved' so another NGO can be selected!
      await query(
        `UPDATE donations
         SET status = 'Approved', matched_ngo_id = NULL, rejection_reason = ?
         WHERE id = ?`,
        [rejection_reason || 'Rejected by NGO', donationId]
      );

      if (donation.donor_id) {
        notificationService.notify(
          donation.donor_id,
          'Donation Offer Re-assigned',
          `The NGO could not accept this offer due to facility limits. Your donation has returned to the pool to choose another partner.`,
          'donation',
          donationId,
          'donation'
        );
      }

      res.json({
        success: true,
        message: 'Donation offer declined. Donation has been returned to the matching pool for re-assignment.',
        status: 'Approved'
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// RECEIPT, INVENTORY & DISTRIBUTION MANAGEMENT
// ============================================================

// @desc Record physical receipt of donation at NGO premises
// @route POST /api/ngo/donations/:donationId/receipt
const recordDonationReceipt = async (req, res) => {
  try {
    const ngoId = await getNgoIdForUser(req.user.id);
    const { donationId } = req.params;
    const { condition_verified = 'Good', notes, requirement_id } = req.body;

    const result = await transaction(async (conn) => {
      // 1. Check donation
      const [donations] = await conn.execute('SELECT * FROM donations WHERE id = ?', [donationId]);
      if (donations.length === 0) {
        throw new Error('Donation not found.');
      }
      const donation = donations[0];

      // 2. Generate unique Receipt Number
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randStr = Math.floor(100000 + Math.random() * 900000);
      const receiptNumber = `RCPT-${dateStr}-${randStr}`;

      // 3. Insert into ngo_receipts
      const [rcptRes] = await conn.execute(
        `INSERT INTO ngo_receipts (
          ngo_id, donation_id, donor_id, donor_name, receipt_number, item_summary, quantity_received, condition_verified, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          ngoId,
          donationId,
          donation.donor_id,
          donation.donor_name,
          receiptNumber,
          `${donation.quantity}x ${donation.item_name} (${donation.category})`,
          donation.quantity,
          condition_verified,
          notes || 'Verified and inspected upon arrival at NGO facility.'
        ]
      );

      // 4. Insert into ngo_inventory
      await conn.execute(
        `INSERT INTO ngo_inventory (
          ngo_id, donation_id, category, item_name, quantity, condition_type, distributed_quantity, status
        ) VALUES (?, ?, ?, ?, ?, ?, 0, 'In Stock')`,
        [
          ngoId,
          donationId,
          donation.category,
          donation.item_name,
          donation.quantity,
          condition_verified
        ]
      );

      // 5. Automatically update active requirement received & remaining quantities!
      let targetReqId = requirement_id;
      if (!targetReqId) {
        // Try to find matching active requirement for this category
        const [matchingReqs] = await conn.execute(
          `SELECT id FROM ngo_requirements
           WHERE ngo_id = ? AND item_category = ? AND status = 'Active'
           ORDER BY remaining_quantity DESC LIMIT 1`,
          [ngoId, donation.category]
        );
        if (matchingReqs.length > 0) {
          targetReqId = matchingReqs[0].id;
        }
      }

      if (targetReqId) {
        await conn.execute(
          `UPDATE ngo_requirements
           SET received_quantity = received_quantity + ?
           WHERE id = ? AND ngo_id = ?`,
          [donation.quantity, targetReqId, ngoId]
        );

        // Check if fulfilled
        const [checkReq] = await conn.execute(
          'SELECT required_quantity, received_quantity FROM ngo_requirements WHERE id = ?',
          [targetReqId]
        );
        if (checkReq.length > 0 && checkReq[0].received_quantity >= checkReq[0].required_quantity) {
          await conn.execute("UPDATE ngo_requirements SET status = 'Fulfilled' WHERE id = ?", [targetReqId]);
        }
      }

      // 6. Update donation status to 'Received by NGO'
      await conn.execute(
        "UPDATE donations SET status = 'Received by NGO' WHERE id = ?",
        [donationId]
      );

      // 7. Award Shahyog reward coins to donor upon verified receipt
      let coinResult = null;
      try {
        coinResult = await coinService.awardDonationCoins(donationId, conn);
      } catch (coinErr) {
        console.error('Coin award notice:', coinErr.message);
      }

      return {
        receiptNumber,
        receiptId: rcptRes.insertId,
        donationId,
        item: donation.item_name,
        quantity: donation.quantity,
        coinsAwarded: coinResult?.coinsAwarded || 0
      };
    });

    res.status(201).json({
      success: true,
      message: 'Donation receipt verified and logged! Added to NGO inventory and requirement quantities auto-updated.',
      receipt: result
    });
  } catch (error) {
    console.error('Error logging donation receipt:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Get current NGO inventory
// @route GET /api/ngo/inventory
const getNgoInventory = async (req, res) => {
  try {
    const ngoId = await getNgoIdForUser(req.user.id);
    const { category = 'all', status = 'all' } = req.query;

    let sql = 'SELECT * FROM ngo_inventory WHERE ngo_id = ?';
    const params = [ngoId];

    if (category !== 'all') {
      sql += ' AND category = ?';
      params.push(category);
    }
    if (status !== 'all') {
      sql += ' AND status = ?';
      params.push(status);
    }

    sql += ' ORDER BY created_at DESC';

    const inventory = await query(sql, params);

    res.json({
      success: true,
      inventory
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Record item distribution to beneficiaries
// @route POST /api/ngo/distributions
const recordDistribution = async (req, res) => {
  try {
    const ngoId = await getNgoIdForUser(req.user.id);
    const {
      inventory_id,
      donation_id,
      item_name,
      beneficiary_group,
      beneficiary_count = 1,
      location,
      distribution_location,
      quantity_distributed,
      distributed_date,
      description,
      notes,
      supporting_photographs = []
    } = req.body;

    const finalLocation = (distribution_location || location || '').trim();
    const finalGroup = (beneficiary_group || `Beneficiary Group (${finalLocation})`).trim();
    const finalDesc = description || notes || '';

    const rawQty = quantity_distributed || req.body.distributed_quantity;
    if (!finalLocation || !rawQty) {
      return res.status(400).json({
        success: false,
        message: 'Distribution location and distributed quantity are required.'
      });
    }

    const distQty = parseInt(rawQty, 10);
    if (isNaN(distQty) || distQty <= 0) {
      return res.status(400).json({ success: false, message: 'Distributed quantity must be positive.' });
    }

    let resolvedDonationId = donation_id || null;
    let resolvedItemName = item_name || 'Relief Goods';

    await transaction(async (conn) => {
      // 1. If inventory_id provided, verify available stock
      if (inventory_id) {
        const [invRows] = await conn.execute(
          'SELECT * FROM ngo_inventory WHERE id = ? AND ngo_id = ?',
          [inventory_id, ngoId]
        );
        if (invRows.length === 0) {
          throw new Error('Inventory batch not found.');
        }

        const inv = invRows[0];
        if (inv.available_quantity < distQty) {
          throw new Error(`Cannot distribute ${distQty} units. Only ${inv.available_quantity} available in this inventory batch.`);
        }

        resolvedItemName = inv.item_name;
        resolvedDonationId = inv.donation_id || resolvedDonationId;

        // Update distributed quantity
        const newDist = inv.distributed_quantity + distQty;
        const newStatus = newDist >= inv.quantity ? 'Fully Distributed' : 'Partially Distributed';

        await conn.execute(
          'UPDATE ngo_inventory SET distributed_quantity = ?, status = ? WHERE id = ?',
          [newDist, newStatus, inventory_id]
        );
      }

      // If donation linked, update donation status and timestamp
      if (resolvedDonationId) {
        await conn.execute(
          `UPDATE donations
           SET distributed_count = distributed_count + ?,
               status = 'Distributed to beneficiaries',
               distributed_at = NOW()
           WHERE id = ?`,
          [distQty, resolvedDonationId]
        );
      }

      // 2. Insert into Phase 2 legacy ngo_distributions for backward compatibility
      await conn.execute(
        `INSERT INTO ngo_distributions (
          ngo_id, inventory_id, beneficiary_group, location, quantity_distributed, distributed_date, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          ngoId,
          inventory_id || null,
          finalGroup,
          finalLocation,
          distQty,
          distributed_date || new Date().toISOString().slice(0, 10),
          finalDesc
        ]
      );

      // 3. Insert into Phase 3 distribution_records with full photograph audit trail
      const randNum = Math.floor(1000 + Math.random() * 9000);
      const distCode = `DST-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${randNum}`;

      const photoJson = Array.isArray(supporting_photographs)
        ? JSON.stringify(supporting_photographs)
        : JSON.stringify([supporting_photographs]);

      await conn.execute(
        `INSERT INTO distribution_records (
          distribution_code, donation_id, ngo_id, item_name, distributed_quantity,
          distribution_date, beneficiary_count, distribution_location, description, supporting_photographs, distribution_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Distributed to beneficiaries')`,
        [
          distCode,
          resolvedDonationId || 0,
          ngoId,
          resolvedItemName,
          distQty,
          distributed_date || new Date().toISOString().slice(0, 10),
          parseInt(beneficiary_count, 10) || 1,
          finalLocation,
          finalDesc,
          photoJson
        ]
      );
    });

    // Notify Donor of ground impact
    if (resolvedDonationId) {
      const [don] = await query('SELECT donor_id, item_name FROM donations WHERE id = ?', [resolvedDonationId]);
      if (don && don.donor_id) {
        notificationService.notify(
          don.donor_id,
          'Direct Ground Impact! 🌟',
          `Your ${resolvedItemName} was distributed directly to ${parseInt(beneficiary_count, 10) || 1} beneficiaries at ${finalLocation}!`,
          'donation',
          resolvedDonationId,
          'donation'
        );
      }
    }

    res.status(201).json({
      success: true,
      message: `Distribution of ${distQty} items to beneficiaries recorded successfully! Status updated to "Distributed to beneficiaries".`,
      distribution: {
        itemName: resolvedItemName,
        quantity: distQty,
        location: finalLocation,
        status: 'Distributed to beneficiaries'
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Get incoming deliveries heading towards this NGO center (with active OTP code)
// @route GET /api/ngo/deliveries/arriving
const getArrivingDeliveries = async (req, res) => {
  try {
    const ngoId = await getNgoIdForUser(req.user.id);
    const deliveries = await query(`
      SELECT da.*, pr.request_code, pr.package_category, pr.package_item_name, pr.package_quantity,
             pr.donor_name, pr.donor_phone, pr.pickup_address, pr.pickup_city,
             dp.vehicle_type, dp.vehicle_number, u.name as driver_name, u.phone as driver_phone,
             dv.otp_code, dv.expires_at as otp_expires_at, dv.is_verified, dv.attempt_count
      FROM delivery_assignments da
      JOIN pickup_requests pr ON da.pickup_request_id = pr.id
      JOIN delivery_partners dp ON da.delivery_partner_id = dp.id
      JOIN users u ON dp.user_id = u.id
      LEFT JOIN delivery_verification dv ON da.id = dv.delivery_assignment_id AND dv.is_verified = 0
      WHERE pr.ngo_id = ? AND da.status IN ('Assigned', 'Out for Pickup', 'Collected', 'Out for Delivery', 'Arrived at NGO')
      ORDER BY da.accepted_at DESC
    `, [ngoId]);

    res.json({ success: true, count: deliveries.length, deliveries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get distribution records with photo evidence
// @route GET /api/ngo/distribution-records
const getDistributionRecords = async (req, res) => {
  try {
    const ngoId = await getNgoIdForUser(req.user.id);
    const records = await query(`
      SELECT dr.*, d.donation_code as tracking_code, d.category as item_category
      FROM distribution_records dr
      LEFT JOIN donations d ON dr.donation_id = d.id
      WHERE dr.ngo_id = ?
      ORDER BY dr.distribution_date DESC, dr.created_at DESC
    `, [ngoId]);

    // Parse photos JSON
    for (const r of records) {
      try {
        r.supporting_photographs = typeof r.supporting_photographs === 'string'
          ? JSON.parse(r.supporting_photographs)
          : (r.supporting_photographs || []);
      } catch (e) {
        r.supporting_photographs = [];
      }
    }

    res.json({ success: true, count: records.length, records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get distribution history for this NGO
// @route GET /api/ngo/distributions
const getDistributions = async (req, res) => {
  try {
    const ngoId = await getNgoIdForUser(req.user.id);
    const distributions = await query(`
      SELECT nd.*, ni.item_name, ni.category
      FROM ngo_distributions nd
      LEFT JOIN ngo_inventory ni ON nd.inventory_id = ni.id
      WHERE nd.ngo_id = ?
      ORDER BY nd.distributed_date DESC, nd.created_at DESC
    `, [ngoId]);

    res.json({
      success: true,
      distributions
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get comprehensive NGO impact report
// @route GET /api/ngo/reports
const getNgoReports = async (req, res) => {
  try {
    const ngoId = await getNgoIdForUser(req.user.id);

    // 1. Receipts summary by category
    const categoryBreakdown = await query(`
      SELECT ni.category,
             COUNT(ni.id) as totalBatches,
             SUM(ni.quantity) as totalUnitsReceived,
             SUM(ni.distributed_quantity) as totalUnitsDistributed,
             SUM(ni.available_quantity) as totalUnitsInStock
      FROM ngo_inventory ni
      WHERE ni.ngo_id = ?
      GROUP BY ni.category
    `, [ngoId]);

    // 2. Requirements fulfillment summary
    const requirementsSummary = await query(`
      SELECT item_category, item_name, required_quantity, received_quantity, remaining_quantity, priority, status
      FROM ngo_requirements
      WHERE ngo_id = ?
      ORDER BY status ASC, priority DESC
    `, [ngoId]);

    // 3. Top distribution locations
    const distributionLocations = await query(`
      SELECT location, beneficiary_group, SUM(quantity_distributed) as unitsDelivered, COUNT(*) as sessions
      FROM ngo_distributions
      WHERE ngo_id = ?
      GROUP BY location, beneficiary_group
      ORDER BY unitsDelivered DESC
      LIMIT 10
    `, [ngoId]);

    // 4. Official Receipts count
    const [receiptCount] = await query('SELECT COUNT(*) as totalReceipts FROM ngo_receipts WHERE ngo_id = ?', [ngoId]);

    res.json({
      success: true,
      reports: {
        categoryBreakdown,
        requirementsSummary,
        distributionLocations,
        totalReceiptsIssued: receiptCount.totalReceipts || 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
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
};
