const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config();

const { query, pool } = require('./src/config/db');
const app = require('./src/server');

let API_BASE = '';

const req = async (endpoint, options = {}) => {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });
    const data = await res.json();
    return { status: res.status, data };
  } catch (err) {
    console.error(`FETCH ERROR on ${API_BASE}${endpoint}:`, err.cause || err);
    throw err;
  }
};

async function runZeroPrefilledAndFundraisingTests() {
  console.log('========================================================================');
  console.log('🎯 SHAHYOG KART - ZERO PREFILLED DATA & VERIFIED FUNDRAISING TEST SUITE');
  console.log('========================================================================\n');

  let server;
  try {
    server = app.listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    const port = server.address().port;
    API_BASE = `http://127.0.0.1:${port}/api`;
    console.log(`📡 Test Server listening on ${API_BASE}\n`);

    // -------------------------------------------------------------
    // Test 1: Real-time Public Stats (Calculated strictly from DB)
    // -------------------------------------------------------------
    const statsRes1 = await req('/stats/public');
    console.log('[Test 1] Public Impact Stats API:', statsRes1.status);
    if (!statsRes1.data.success || typeof statsRes1.data.stats.totalFundsRaised !== 'number') {
      throw new Error('Public stats failed or returned invalid format.');
    }
    console.log('         Initial DB Stats:', statsRes1.data.stats);

    // -------------------------------------------------------------
    // Test 2: Admin Login
    // -------------------------------------------------------------
    const adminLogin = await req('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@shahyogkart.com', password: 'Admin@123' })
    });
    if (!adminLogin.data.token) throw new Error('Admin login failed: ' + JSON.stringify(adminLogin.data));
    const adminToken = adminLogin.data.token;
    console.log('[Test 2] Super Admin Authenticated: Token acquired.');

    // -------------------------------------------------------------
    // Test 3: New Customer Registration & DB Counter Sync
    // -------------------------------------------------------------
    const rand = Math.floor(Math.random() * 100000);
    const donorEmail = `zerofake_donor_${rand}@test.com`;
    const regRes = await req('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: `Real Donor ${rand}`,
        email: donorEmail,
        password: 'Password@123',
        phone: '+91 9988776655',
        role: 'customer'
      })
    });
    if (regRes.status !== 201 || !regRes.data.user) {
      throw new Error('Customer registration failed: ' + JSON.stringify(regRes.data));
    }
    const donorId = regRes.data.user.id;
    const donorToken = regRes.data.token;
    console.log(`[Test 3] New User Registered: ID ${donorId}, Email: ${donorEmail}`);

    const adminStatsRes = await req('/admin/stats', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log(`         Admin Dashboard Users Count: ${adminStatsRes.data.stats.totalUsers}`);
    if (adminStatsRes.data.stats.totalUsers < 1) {
      throw new Error('Admin stats does not reflect registered user count.');
    }

    // -------------------------------------------------------------
    // Test 4: NGO Registration (Status must be pending)
    // -------------------------------------------------------------
    const ngoEmail = `zerofake_ngo_${rand}@test.com`;
    const ngoReg = await req('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: `Founder ${rand}`,
        email: ngoEmail,
        password: 'Password@123',
        phone: '+91 9123456789',
        role: 'ngo',
        organization_name: `Grassroots Relief Trust ${rand}`
      })
    });
    if (ngoReg.status !== 201) throw new Error('NGO registration failed: ' + JSON.stringify(ngoReg.data));
    const ngoUserId = ngoReg.data.user.id;
    const ngoToken = ngoReg.data.token;
    console.log(`[Test 4] NGO Registered: User ID ${ngoUserId}, Status: ${ngoReg.data.user.status}`);
    if (ngoReg.data.user.status !== 'pending' && ngoReg.data.user.status !== 'pending_verification') {
      throw new Error('NGO should require admin verification.');
    }

    // -------------------------------------------------------------
    // Test 5: Admin Approves NGO
    // -------------------------------------------------------------
    // Ensure NGO table entry exists
    let [ngoRecord] = await query('SELECT * FROM ngos WHERE user_id = ?', [ngoUserId]);
    if (!ngoRecord) {
      const ins = await query(`
        INSERT INTO ngos (user_id, organization_name, registration_number, contact_person, phone, email, address, city, state, accepted_categories, verified_by_admin)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      `, [
        ngoUserId,
        `Grassroots Relief Trust ${rand}`,
        `REG-NGO-${rand}`,
        `Founder ${rand}`,
        '+91 9123456789',
        ngoEmail,
        'Road No 4, Relief Colony',
        'Jaipur',
        'Rajasthan',
        JSON.stringify(['Books', 'Clothes', 'Food', 'Blankets'])
      ]);
      [ngoRecord] = await query('SELECT * FROM ngos WHERE id = ?', [ins.insertId]);
    } else {
      await query("UPDATE ngos SET verified_by_admin = 1 WHERE id = ?", [ngoRecord.id]);
    }

    await query("UPDATE users SET status = 'approved' WHERE id = ?", [ngoUserId]);
    console.log(`[Test 5] NGO Approved & Verified: NGO ID ${ngoRecord.id}`);

    // -------------------------------------------------------------
    // Test 6: NGO Creates a Real Fundraising Campaign
    // -------------------------------------------------------------
    const campGoal = 50000;
    const createCampRes = await req('/fundraising/my-campaigns', {
      method: 'POST',
      headers: { Authorization: `Bearer ${ngoToken}` },
      body: JSON.stringify({
        title: `Winter Relief Blanket Drive ${rand}`,
        description: 'Providing 1000 thermal fleece blankets to homeless families in winter.',
        fundraising_goal: campGoal,
        start_date: '2026-11-20',
        end_date: '2026-12-31'
      })
    });
    if (createCampRes.status !== 201 || !createCampRes.data.campaignId) {
      throw new Error('Campaign creation failed: ' + JSON.stringify(createCampRes.data));
    }
    const campaignId = createCampRes.data.campaignId;
    console.log(`[Test 6] Fundraising Campaign Created: ID ${campaignId}, Goal: ₹${campGoal}`);

    // -------------------------------------------------------------
    // Test 7: Verify Campaign Initially Displays Exactly ₹0 Raised
    // -------------------------------------------------------------
    const campDetails1 = await req(`/fundraising/campaigns/${campaignId}`);
    if (campDetails1.status !== 200 || !campDetails1.data.campaign) {
      throw new Error('Failed to fetch campaign details.');
    }
    const c1 = campDetails1.data.campaign;
    console.log(`[Test 7] Initial Campaign State: Raised = ₹${c1.amount_raised}, Remaining = ₹${c1.remaining_amount}`);
    if (parseFloat(c1.amount_raised) !== 0) {
      throw new Error(`Expected initial amount_raised to be 0, but got ${c1.amount_raised}`);
    }
    if (parseFloat(c1.remaining_amount) !== campGoal) {
      throw new Error(`Expected remaining_amount to equal goal ${campGoal}, but got ${c1.remaining_amount}`);
    }

    // -------------------------------------------------------------
    // Test 8: Initiate Pending Fund Donation (Must NOT count toward total)
    // -------------------------------------------------------------
    const initPending = await req('/fundraising/donate', {
      method: 'POST',
      body: JSON.stringify({
        campaign_id: campaignId,
        ngo_id: ngoRecord.id,
        amount: 3000,
        donor_name: 'Ananya Roy',
        donor_email: 'ananya@example.com'
      })
    });
    if (initPending.status !== 201) throw new Error('Initiate donation failed: ' + JSON.stringify(initPending.data));
    const pendingTxn = initPending.data.transaction;
    console.log(`[Test 8] Pending Fund Donation Initiated: ₹${pendingTxn.amount}, Txn: ${pendingTxn.transaction_id}`);

    // Verify campaign is STILL ₹0 (pending excluded)
    const campDetails2 = await req(`/fundraising/campaigns/${campaignId}`);
    console.log(`[Test 9] Pending Excluded Check: Amount Raised is still ₹${campDetails2.data.campaign.amount_raised}`);
    if (parseFloat(campDetails2.data.campaign.amount_raised) !== 0) {
      throw new Error('Pending payments should NOT count towards verified amount raised.');
    }

    // -------------------------------------------------------------
    // Test 10: Failed Payment Simulation (Must NOT count toward total)
    // -------------------------------------------------------------
    const failRes = await req('/fundraising/verify-payment', {
      method: 'POST',
      body: JSON.stringify({
        transaction_id: pendingTxn.transaction_id,
        payment_gateway_ref: pendingTxn.gateway_reference,
        status: 'failed'
      })
    });
    console.log('[Test 10] Payment Marked Failed:', failRes.data.message);

    const campDetails3 = await req(`/fundraising/campaigns/${campaignId}`);
    if (parseFloat(campDetails3.data.campaign.amount_raised) !== 0) {
      throw new Error('Failed payments should NOT count towards verified amount raised.');
    }
    console.log(`[Test 11] Failed Excluded Check: Amount Raised is still ₹${campDetails3.data.campaign.amount_raised}`);

    // -------------------------------------------------------------
    // Test 12: Successful Verified Payment (₹7,500)
    // -------------------------------------------------------------
    const verifiedAmount = 7500;
    const initSuccess = await req('/fundraising/donate', {
      method: 'POST',
      headers: { Authorization: `Bearer ${donorToken}` },
      body: JSON.stringify({
        campaign_id: campaignId,
        ngo_id: ngoRecord.id,
        amount: verifiedAmount,
        donor_name: `Real Donor ${rand}`,
        donor_email: donorEmail
      })
    });
    const successTxn = initSuccess.data.transaction;

    const verifySuccess = await req('/fundraising/verify-payment', {
      method: 'POST',
      body: JSON.stringify({
        transaction_id: successTxn.transaction_id,
        payment_gateway_ref: successTxn.gateway_reference,
        status: 'completed'
      })
    });
    if (!verifySuccess.data.success) {
      throw new Error('Payment verification failed: ' + JSON.stringify(verifySuccess.data));
    }
    console.log(`[Test 12] Payment Verified: Status ${verifySuccess.status}, Msg: ${verifySuccess.data.message}`);

    // -------------------------------------------------------------
    // Test 13: Campaign Raised Total Successfully Updated from DB
    // -------------------------------------------------------------
    const campDetails4 = await req(`/fundraising/campaigns/${campaignId}`);
    const c4 = campDetails4.data.campaign;
    console.log(`[Test 13] Updated Campaign Total: Raised = ₹${c4.amount_raised}, Remaining = ₹${c4.remaining_amount}`);
    if (parseFloat(c4.amount_raised) !== verifiedAmount) {
      throw new Error(`Expected amount_raised to be ${verifiedAmount}, but got ${c4.amount_raised}`);
    }
    if (parseFloat(c4.remaining_amount) !== campGoal - verifiedAmount) {
      throw new Error(`Expected remaining to be ${campGoal - verifiedAmount}, but got ${c4.remaining_amount}`);
    }

    // -------------------------------------------------------------
    // Test 14: Duplicate Webhook / Verification Call Prevention (Idempotency)
    // -------------------------------------------------------------
    const duplicateVerify = await req('/fundraising/verify-payment', {
      method: 'POST',
      body: JSON.stringify({
        transaction_id: successTxn.transaction_id,
        payment_gateway_ref: successTxn.gateway_reference,
        status: 'completed'
      })
    });
    console.log(`[Test 14] Duplicate Webhook Call: Status ${duplicateVerify.status}, Msg: ${duplicateVerify.data.message}`);

    const campDetails5 = await req(`/fundraising/campaigns/${campaignId}`);
    if (parseFloat(campDetails5.data.campaign.amount_raised) !== verifiedAmount) {
      throw new Error(`DUPLICATE PAYMENT BUG: Amount raised doubled to ${campDetails5.data.campaign.amount_raised}!`);
    }
    console.log(`         Idempotency Confirmed: Amount raised remains exactly ₹${campDetails5.data.campaign.amount_raised}.`);

    // -------------------------------------------------------------
    // Test 15: Audit Log Integrity Verification
    // -------------------------------------------------------------
    const audits = await query(`
      SELECT action, entity_type, entity_id 
      FROM audit_logs 
      WHERE (entity_type = 'campaign' AND entity_id = ?) 
         OR (entity_type = 'payment' AND entity_id = ?)
    `, [campaignId, successTxn.id]);
    console.log(`[Test 15] Audit Logs Recorded for Campaign & Payment: ${audits.length} entries`);
    const actionTypes = audits.map((a) => a.action);
    console.log('         Actions Logged:', actionTypes);
    if (!actionTypes.includes('CAMPAIGN_CREATE') || !actionTypes.includes('PAYMENT_VERIFIED')) {
      throw new Error('Audit logs missing expected operations.');
    }

    // -------------------------------------------------------------
    // Test 16: Public Stats Dynamically Incremented
    // -------------------------------------------------------------
    const statsRes2 = await req('/stats/public');
    console.log(`[Test 16] Live Public Stats Updated: Total Funds Raised = ₹${statsRes2.data.stats.totalFundsRaised}`);
    if (statsRes2.data.stats.totalFundsRaised < verifiedAmount) {
      throw new Error('Public funds raised did not increment with verified payment.');
    }

    console.log('\n========================================================================');
    console.log('🎉 ALL ZERO PREFILLED DATA & REAL-TIME VERIFICATION TESTS PASSED 100%!');
    console.log('========================================================================\n');

  } catch (error) {
    console.error('\n❌ ZERO PREFILLED DATA SUITE FAILED:', error.message);
    if (error.stack) console.error(error.stack);
    process.exitCode = 1;
  } finally {
    if (server) {
      server.close();
      console.log('🛑 Test Server stopped.');
    }
    await pool.end();
  }
}

runZeroPrefilledAndFundraisingTests();
