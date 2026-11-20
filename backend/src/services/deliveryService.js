const { query, transaction } = require('../config/db');
const coinService = require('./coinService');
const notificationService = require('./notificationService');

class DeliveryService {
  /**
   * Automatically create a pickup request when an NGO accepts a donation
   */
  async createPickupRequest(donationId, ngoId) {
    const [don] = await query('SELECT * FROM donations WHERE id = ?', [donationId]);
    if (!don) throw new Error('Donation not found.');

    const [ngo] = await query('SELECT * FROM ngos WHERE id = ?', [ngoId]);
    if (!ngo) throw new Error('NGO not found.');

    // Check if pickup request already exists
    const [existing] = await query('SELECT * FROM pickup_requests WHERE donation_id = ?', [donationId]);
    if (existing) return existing;

    const randNum = Math.floor(1000 + Math.random() * 9000);
    const requestCode = `PKP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${randNum}`;

    const priority = ['Food', 'Blankets'].includes(don.category) ? 'Urgent' : 'Normal';

    const insertRes = await query(
      `INSERT INTO pickup_requests (
        request_code, donation_id, ngo_id, status, priority,
        donor_name, donor_phone, pickup_address, pickup_city, pickup_latitude, pickup_longitude,
        ngo_name, ngo_address, ngo_city, ngo_latitude, ngo_longitude,
        package_category, package_item_name, package_quantity, scheduled_pickup_date, notes
      ) VALUES (?, ?, ?, 'Pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), ?)`,
      [
        requestCode,
        donationId,
        ngoId,
        priority,
        don.donor_name || 'Generous Donor',
        don.donor_phone || '9876543210',
        don.pickup_address || 'Donor Pickup Address',
        don.pickup_city || 'Delhi',
        don.pickup_latitude || 28.6139,
        don.pickup_longitude || 77.2090,
        ngo.organization_name,
        ngo.address || 'NGO Distribution Center',
        ngo.city || 'Delhi',
        ngo.latitude || 28.6139,
        ngo.longitude || 77.2090,
        don.category,
        don.item_name,
        don.quantity,
        `Doorstep collection of ${don.quantity}x ${don.item_name} for ${ngo.organization_name}.`
      ]
    );

    const [created] = await query('SELECT * FROM pickup_requests WHERE id = ?', [insertRes.insertId]);
    return created;
  }

  /**
   * Get all open/available pickup requests available for delivery partners
   */
  async getAvailablePickupRequests(city = null) {
    let sql = `
      SELECT pr.*, d.donation_code, d.condition_type as item_condition,
             COALESCE(pr.donor_name, d.donor_name) as donor_name
      FROM pickup_requests pr
      JOIN donations d ON pr.donation_id = d.id
      WHERE pr.status = 'Pending'
    `;
    const params = [];

    if (city) {
      sql += ' AND (pr.pickup_city LIKE ? OR pr.ngo_city LIKE ?)';
      params.push(`%${city}%`, `%${city}%`);
    }

    sql += ' ORDER BY CASE WHEN pr.priority = "Urgent" THEN 1 WHEN pr.priority = "High" THEN 2 ELSE 3 END, pr.created_at ASC';

    return await query(sql, params);
  }

  /**
   * Delivery partner accepts an open pickup request
   */
  async acceptPickupRequest(userId, pickupRequestId) {
    return await transaction(async (conn) => {
      // 1. Resolve delivery partner
      const [partners] = await conn.execute('SELECT * FROM delivery_partners WHERE user_id = ?', [userId]);
      if (partners.length === 0) {
        throw new Error('Delivery partner profile not registered for this account.');
      }
      const partner = partners[0];

      // 2. Lock & check pickup request
      const [requests] = await conn.execute(
        'SELECT * FROM pickup_requests WHERE id = ? FOR UPDATE',
        [pickupRequestId]
      );
      if (requests.length === 0) {
        throw new Error('Pickup request not found.');
      }
      const req = requests[0];
      if (req.status !== 'Pending') {
        throw new Error(`This pickup request has already been ${req.status.toLowerCase()} by another partner.`);
      }

      // 3. Generate assignment code
      const randNum = Math.floor(1000 + Math.random() * 9000);
      const assignmentCode = `DLV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${randNum}`;

      // 4. Create delivery assignment
      const [assignRes] = await conn.execute(
        `INSERT INTO delivery_assignments (
          assignment_code, pickup_request_id, donation_id, delivery_partner_id, status, accepted_at, notes
        ) VALUES (?, ?, ?, ?, 'Assigned', NOW(), ?)`,
        [
          assignmentCode,
          pickupRequestId,
          req.donation_id,
          partner.id,
          `Accepted by delivery partner ${partner.vehicle_type} (${partner.vehicle_number}).`
        ]
      );
      const assignmentId = assignRes.insertId;

      // 5. Update pickup request status
      await conn.execute(
        'UPDATE pickup_requests SET status = "Accepted" WHERE id = ?',
        [pickupRequestId]
      );

      // 6. Update donation status to 'Pickup Assigned'
      await conn.execute(
        'UPDATE donations SET status = "Pickup Assigned", delivery_partner_id = ? WHERE id = ?',
        [partner.id, req.donation_id]
      );

      // 7. Log initial delivery tracking audit breadcrumb
      await conn.execute(
        `INSERT INTO delivery_tracking (
          delivery_assignment_id, donation_id, status_update, current_latitude, current_longitude, location_name, remarks
        ) VALUES (?, ?, 'Pickup Assigned to Delivery Partner', ?, ?, ?, ?)`,
        [
          assignmentId,
          req.donation_id,
          partner.current_latitude,
          partner.current_longitude,
          partner.current_city,
          `Driver accepted trip. Scheduled for doorstep collection at ${req.pickup_address}.`
        ]
      );

      // Notify donor of courier assignment
      const [donRows] = await conn.execute('SELECT donor_id, item_name FROM donations WHERE id = ?', [req.donation_id]);
      if (donRows.length > 0 && donRows[0].donor_id) {
        notificationService.notify(
          donRows[0].donor_id,
          'Courier Assigned for Doorstep Pickup 🚚',
          `Courier partner (${partner.vehicle_type} - ${partner.vehicle_number}) has accepted your pickup trip.`,
          'delivery',
          req.donation_id,
          'donation'
        );
      }

      return {
        assignmentId,
        assignmentCode,
        pickupRequestId,
        donationId: req.donation_id,
        status: 'Assigned'
      };
    });
  }

  /**
   * Get active and past assignments for a delivery partner
   */
  async getPartnerDeliveries(userId, filter = 'active') {
    const [partner] = await query('SELECT * FROM delivery_partners WHERE user_id = ?', [userId]);
    if (!partner) throw new Error('Delivery partner profile not found.');

    let statusCondition = '';
    if (filter === 'active') {
      statusCondition = "AND da.status IN ('Assigned', 'Out for Pickup', 'Collected', 'Out for Delivery', 'Arrived at NGO')";
    } else if (filter === 'completed') {
      statusCondition = "AND da.status = 'Completed'";
    }

    const assignments = await query(
      `SELECT da.*,
              pr.request_code, pr.priority, pr.package_category, pr.package_item_name, pr.package_quantity,
              pr.donor_name, pr.donor_phone, pr.pickup_address, pr.pickup_city, pr.pickup_latitude, pr.pickup_longitude,
              pr.ngo_name, pr.ngo_address, pr.ngo_city, pr.ngo_latitude, pr.ngo_longitude,
              d.donation_code, d.condition_type as item_condition,
              dv.otp_code as active_otp, dv.expires_at as otp_expires_at, dv.is_verified as otp_verified
       FROM delivery_assignments da
       JOIN pickup_requests pr ON da.pickup_request_id = pr.id
       JOIN donations d ON da.donation_id = d.id
       LEFT JOIN delivery_verification dv ON da.id = dv.delivery_assignment_id AND dv.is_verified = 0
       WHERE da.delivery_partner_id = ? ${statusCondition}
       ORDER BY da.accepted_at DESC`,
      [partner.id]
    );

    return assignments;
  }

  /**
   * Get dashboard overview metrics for delivery partner
   */
  async getPartnerDashboardOverview(userId) {
    const [partner] = await query('SELECT * FROM delivery_partners WHERE user_id = ?', [userId]);
    if (!partner) throw new Error('Delivery partner profile not found.');

    const [stats] = await query(`
      SELECT
        COUNT(*) as totalAssigned,
        SUM(CASE WHEN status IN ('Assigned', 'Out for Pickup', 'Collected', 'Out for Delivery', 'Arrived at NGO') THEN 1 ELSE 0 END) as activeTrips,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completedDeliveries,
        SUM(CASE WHEN status = 'Collected' THEN 1 ELSE 0 END) as itemsCollected
      FROM delivery_assignments
      WHERE delivery_partner_id = ?
    `, [partner.id]);

    const [pendingPickups] = await query(`
      SELECT COUNT(*) as availableCount FROM pickup_requests WHERE status = 'Pending'
    `);

    return {
      partner,
      metrics: {
        activeTrips: stats.activeTrips || 0,
        completedDeliveries: stats.completedDeliveries || 0,
        availablePickups: pendingPickups.availableCount || 0,
        totalAssigned: stats.totalAssigned || 0,
        rating: partner.rating || 4.9,
        isAvailable: partner.is_available
      }
    };
  }

  /**
   * Update delivery assignment progression
   * e.g. 'Assigned' -> 'Out for Pickup' -> 'Collected' -> 'Out for Delivery' -> 'Arrived at NGO'
   */
  async updateDeliveryStatus(userId, assignmentId, newStatus, trackingNotes = {}) {
    const [partner] = await query('SELECT * FROM delivery_partners WHERE user_id = ?', [userId]);
    if (!partner) throw new Error('Delivery partner profile not found.');

    const [assign] = await query(
      'SELECT * FROM delivery_assignments WHERE id = ? AND delivery_partner_id = ?',
      [assignmentId, partner.id]
    );
    if (!assign) throw new Error('Assignment not found or unauthorized.');

    const allowedStatuses = ['Out for Pickup', 'Collected', 'Out for Delivery', 'Arrived at NGO'];
    const statusMap = {
      'out for pickup': 'Out for Pickup',
      'out_for_pickup': 'Out for Pickup',
      'collected': 'Collected',
      'out for delivery': 'Out for Delivery',
      'out_for_delivery': 'Out for Delivery',
      'arrived at ngo': 'Arrived at NGO',
      'arrived_at_ngo': 'Arrived at NGO'
    };
    const canonicalStatus = statusMap[newStatus?.toLowerCase()?.trim()] || newStatus;

    if (!allowedStatuses.includes(canonicalStatus)) {
      throw new Error(`Invalid status update: ${newStatus}`);
    }
    newStatus = canonicalStatus;

    return await transaction(async (conn) => {
      let collectedAtSql = '';
      if (newStatus === 'Collected') {
        collectedAtSql = ', collected_at = NOW()';
        // Also update donation status to 'Collected'
        await conn.execute('UPDATE donations SET status = "Collected" WHERE id = ?', [assign.donation_id]);
        await conn.execute('UPDATE pickup_requests SET status = "In Transit" WHERE id = ?', [assign.pickup_request_id]);
      }

      // Update assignment status
      await conn.execute(
        `UPDATE delivery_assignments SET status = ? ${collectedAtSql} WHERE id = ?`,
        [newStatus, assignmentId]
      );

      // Breadcrumb remarks based on status
      const remarksMap = {
        'Out for Pickup': 'Partner is traveling to the donor doorstep.',
        'Collected': 'Items securely collected from donor and verified.',
        'Out for Delivery': 'Partner is in transit towards the NGO distribution center.',
        'Arrived at NGO': 'Partner has arrived at the NGO hub; awaiting OTP verification from NGO staff.'
      };

      // Insert tracking update
      await conn.execute(
        `INSERT INTO delivery_tracking (
          delivery_assignment_id, donation_id, status_update, current_latitude, current_longitude, location_name, remarks
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          assignmentId,
          assign.donation_id,
          newStatus,
          trackingNotes.latitude || partner.current_latitude,
          trackingNotes.longitude || partner.current_longitude,
          trackingNotes.location_name || partner.current_city,
          trackingNotes.remarks || remarksMap[newStatus]
        ]
      );

      // If status is 'Arrived at NGO', automatically generate/refresh the OTP verification code
      if (newStatus === 'Arrived at NGO') {
        const [pickupReq] = await conn.execute(
          'SELECT ngo_id FROM pickup_requests WHERE id = ?',
          [assign.pickup_request_id]
        );
        const ngoId = pickupReq[0].ngo_id;
        await this.generateDeliveryOtpInternal(conn, assignmentId, assign.donation_id, ngoId);

        // Notify NGO staff
        const [ngoUser] = await conn.execute('SELECT user_id, organization_name FROM ngos WHERE id = ?', [ngoId]);
        if (ngoUser.length > 0 && ngoUser[0].user_id) {
          notificationService.notify(
            ngoUser[0].user_id,
            'Courier Arrived with Donation 🚪',
            `Courier has arrived at facility gate. Check Arriving Couriers tab for your 6-digit handover OTP.`,
            'delivery',
            assign.donation_id,
            'donation'
          );
        }
      } else if (newStatus === 'Collected') {
        const [donRows] = await conn.execute('SELECT donor_id, item_name FROM donations WHERE id = ?', [assign.donation_id]);
        if (donRows.length > 0 && donRows[0].donor_id) {
          notificationService.notify(
            donRows[0].donor_id,
            'Items Collected from Doorstep 📦',
            `Courier collected your ${donRows[0].item_name} from your address. Now en route to NGO center.`,
            'delivery',
            assign.donation_id,
            'donation'
          );
        }
      }

      return { success: true, assignmentId, status: newStatus };
    });
  }

  /**
   * Internal helper to generate secure OTP with 15-minute expiration
   */
  async generateDeliveryOtpInternal(conn, assignmentId, donationId, ngoId) {
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    // Invalidate any older unverified OTPs
    await conn.execute(
      'DELETE FROM delivery_verification WHERE delivery_assignment_id = ? AND is_verified = 0',
      [assignmentId]
    );

    await conn.execute(
      `INSERT INTO delivery_verification (
        delivery_assignment_id, donation_id, ngo_id, otp_code, expires_at, attempt_count, max_attempts, is_verified
      ) VALUES (?, ?, ?, ?, ?, 0, 5, 0)`,
      [assignmentId, donationId, ngoId, otpCode, expiresAt]
    );

    return otpCode;
  }

  /**
   * Generate/Request OTP explicitly
   */
  async requestDeliveryOtp(assignmentId) {
    const [assign] = await query('SELECT * FROM delivery_assignments WHERE id = ?', [assignmentId]);
    if (!assign) throw new Error('Assignment not found.');

    const [pickupReq] = await query('SELECT ngo_id FROM pickup_requests WHERE id = ?', [assign.pickup_request_id]);
    const ngoId = pickupReq.ngo_id;

    return await transaction(async (conn) => {
      const otpCode = await this.generateDeliveryOtpInternal(conn, assignmentId, assign.donation_id, ngoId);
      return { success: true, message: 'Fresh 6-digit OTP generated and dispatched to NGO authorized portal.' };
    });
  }

  /**
   * Verify OTP submitted by delivery partner upon arrival at NGO
   */
  async verifyDeliveryOtp(userId, assignmentId, enteredOtp) {
    if (!enteredOtp || enteredOtp.trim().length !== 6) {
      throw new Error('Please enter a valid 6-digit verification OTP.');
    }

    const [partner] = await query('SELECT * FROM delivery_partners WHERE user_id = ?', [userId]);
    if (!partner) throw new Error('Delivery partner profile not found.');

    return await transaction(async (conn) => {
      // 1. Fetch unverified verification record
      const [verifications] = await conn.execute(
        `SELECT * FROM delivery_verification
         WHERE delivery_assignment_id = ? AND is_verified = 0
         ORDER BY id DESC LIMIT 1 FOR UPDATE`,
        [assignmentId]
      );

      if (verifications.length === 0) {
        throw new Error('No active verification session found for this delivery.');
      }

      const ver = verifications[0];

      // Check max attempts
      if (ver.attempt_count >= ver.max_attempts) {
        throw new Error('Maximum OTP verification attempts exceeded (5/5). Please request a fresh OTP from the NGO.');
      }

      // Check expiration
      if (new Date(ver.expires_at) < new Date()) {
        throw new Error('Verification OTP has expired. Please ask the NGO representative to refresh the code.');
      }

      // Check OTP match
      if (ver.otp_code !== enteredOtp.trim()) {
        await conn.execute(
          'UPDATE delivery_verification SET attempt_count = attempt_count + 1 WHERE id = ?',
          [ver.id]
        );
        const attemptsLeft = ver.max_attempts - (ver.attempt_count + 1);
        throw new Error(`Invalid OTP. ${attemptsLeft} attempts remaining.`);
      }

      // 2. Mark verification verified
      await conn.execute(
        `UPDATE delivery_verification
         SET is_verified = 1, verified_at = NOW(), verified_by_user_id = ?
         WHERE id = ?`,
        [userId, ver.id]
      );

      // 3. Mark delivery assignment completed
      await conn.execute(
        `UPDATE delivery_assignments
         SET status = 'Completed', delivered_at = NOW()
         WHERE id = ?`,
        [assignmentId]
      );

      // 4. Mark pickup request Delivered
      const [assignRows] = await conn.execute('SELECT * FROM delivery_assignments WHERE id = ?', [assignmentId]);
      const assignment = assignRows[0];

      await conn.execute(
        'UPDATE pickup_requests SET status = "Delivered" WHERE id = ?',
        [assignment.pickup_request_id]
      );

      // 5. Update delivery partner stats
      await conn.execute(
        'UPDATE delivery_partners SET total_deliveries = total_deliveries + 1 WHERE id = ?',
        [partner.id]
      );

      // 6. Update donation status to 'Received by NGO'
      await conn.execute(
        'UPDATE donations SET status = "Received by NGO" WHERE id = ?',
        [assignment.donation_id]
      );

      // 7. Log final tracking milestone
      await conn.execute(
        `INSERT INTO delivery_tracking (
          delivery_assignment_id, donation_id, status_update, current_latitude, current_longitude, location_name, remarks
        ) VALUES (?, ?, 'Delivered to NGO & Verified via OTP', ?, ?, ?, ?)`,
        [
          assignmentId,
          assignment.donation_id,
          partner.current_latitude,
          partner.current_longitude,
          partner.current_city,
          'Items officially handed over to NGO authorized representative. Safe custody verified.'
        ]
      );

      // 7b. Automatically generate NGO Receipt and update NGO Inventory upon verified delivery
      const [donItemRows] = await conn.execute(
        'SELECT id, donor_id, donor_name, item_name, category, quantity, matched_ngo_id FROM donations WHERE id = ?',
        [assignment.donation_id]
      );
      if (donItemRows.length > 0) {
        const item = donItemRows[0];
        const targetNgo = item.matched_ngo_id || ver.ngo_id;
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const randStr = Math.floor(100000 + Math.random() * 900000);
        const receiptNumber = `RCPT-${dateStr}-${randStr}`;

        const [existingRcpt] = await conn.execute(
          'SELECT id FROM ngo_receipts WHERE donation_id = ?',
          [assignment.donation_id]
        );
        if (existingRcpt.length === 0) {
          await conn.execute(
            `INSERT INTO ngo_receipts (
              ngo_id, donation_id, donor_id, donor_name, receipt_number, item_summary, quantity_received, condition_verified, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Good', 'Verified via delivery OTP code.')`,
            [
              targetNgo,
              assignment.donation_id,
              item.donor_id,
              item.donor_name || 'Anonymous Donor',
              receiptNumber,
              `${item.quantity}x ${item.item_name} (${item.category})`,
              item.quantity
            ]
          );

          await conn.execute(
            `INSERT INTO ngo_inventory (
              ngo_id, donation_id, category, item_name, quantity, condition_type, distributed_quantity, status
            ) VALUES (?, ?, ?, ?, ?, 'Good', 0, 'In Stock')`,
            [targetNgo, assignment.donation_id, item.category, item.item_name, item.quantity]
          );
        }
      }

      // 8. AWARD REWARD COINS TO DONOR (Connected to actual physical NGO verification!)
      const coinResult = await coinService.awardDonationCoins(assignment.donation_id, conn);

      // Notify donor that delivery was verified
      const [donInfo] = await conn.execute('SELECT donor_id, item_name FROM donations WHERE id = ?', [assignment.donation_id]);
      if (donInfo.length > 0 && donInfo[0].donor_id) {
        notificationService.notify(
          donInfo[0].donor_id,
          'Donation Safely Received by NGO! 🏛️',
          `Your ${donInfo[0].item_name} has arrived at the NGO center and was verified via secure OTP.`,
          'donation',
          assignment.donation_id,
          'donation'
        );
      }

      return {
        success: true,
        message: 'Delivery verified successfully! Donation marked as Received by NGO.',
        verifiedAt: new Date().toISOString(),
        coinsAwarded: coinResult.coinsAwarded || 0,
        donorName: coinResult.donorName || 'Donor'
      };
    });
  }

  /**
   * Get full tracking timeline for a donation or assignment
   */
  async getDeliveryTrackingTimeline(identifier) {
    let donationId = null;

    if (!isNaN(identifier)) {
      donationId = parseInt(identifier, 10);
    } else {
      const [don] = await query('SELECT id FROM donations WHERE donation_code = ?', [identifier]);
      if (don) donationId = don.id;
    }

    if (!donationId) return { logs: [] };

    const logs = await query(
      `SELECT dt.*, da.assignment_code, dp.vehicle_type, dp.vehicle_number
       FROM delivery_tracking dt
       LEFT JOIN delivery_assignments da ON dt.delivery_assignment_id = da.id
       LEFT JOIN delivery_partners dp ON da.delivery_partner_id = dp.id
       WHERE dt.donation_id = ?
       ORDER BY dt.created_at ASC`,
      [donationId]
    );

    return { donationId, logs };
  }
}

module.exports = new DeliveryService();
