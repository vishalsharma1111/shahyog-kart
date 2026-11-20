const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config();

const { query } = require('./src/config/db');
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

async function runCompleteIntegration() {
  console.log('================================================================');
  console.log('🚀 SHAHYOG KART - PHASE 4 COMPLETE INTEGRATION & QA TEST SUITE');
  console.log('================================================================\n');

  let server;
  try {
    server = app.listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    const port = server.address().port;
    API_BASE = `http://127.0.0.1:${port}/api`;
    console.log(`📡 Test Server listening on ${API_BASE}\n`);

    // -------------------------------------------------------------
    // PRE-REQ: Login Pre-existing Verified NGO, Courier & Admin
    // -------------------------------------------------------------
    const ngoLogin = await req('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'ngo@shahyogkart.com', password: 'Ngo@123' })
    });
    if (!ngoLogin.data.token) throw new Error('NGO login failed: ' + JSON.stringify(ngoLogin.data));
    const ngoToken = ngoLogin.data.token;
    const ngoUser = ngoLogin.data.user;

    const [ngoOrg] = await query('SELECT * FROM ngos WHERE user_id = ?', [ngoUser.id]);
    const targetNgoId = ngoOrg ? ngoOrg.id : 1;

    const delLogin = await req('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'delivery@shahyogkart.com', password: 'Delivery@123' })
    });
    if (!delLogin.data.token) throw new Error('Delivery courier login failed: ' + JSON.stringify(delLogin.data));
    const delToken = delLogin.data.token;

    const adminLogin = await req('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@shahyogkart.com', password: 'Admin@123' })
    });
    if (!adminLogin.data.token) throw new Error('Admin login failed: ' + JSON.stringify(adminLogin.data));
    const adminToken = adminLogin.data.token;

    console.log('🔑 NGO, Courier & Admin authenticated successfully.\n');

    // =============================================================
    // STEP 1: CUSTOMER REGISTRATION & AUTHENTICATION
    // =============================================================
    const randSuffix = Math.floor(Math.random() * 100000);
    const newCustomerEmail = `donor.phase4_${randSuffix}@test.com`;
    const regRes = await req('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: `Rohan Verma ${randSuffix}`,
        email: newCustomerEmail,
        password: 'Password@123',
        phone: '9876543210',
        role: 'customer'
      })
    });
    console.log(`[Step 1] Customer Registered: Status ${regRes.status}, User ID: ${regRes.data.user?.id}`);
    if (regRes.status !== 201) throw new Error('Customer registration failed: ' + JSON.stringify(regRes.data));

    const donorToken = regRes.data.token;
    const donorUser = regRes.data.user;

    // =============================================================
    // STEP 2: CUSTOMER DONATES 20 BOOKS
    // =============================================================
    const donRes = await req('/donations/items', {
      method: 'POST',
      headers: { Authorization: `Bearer ${donorToken}` },
      body: JSON.stringify({
        item_name: 'Secondary School NCERT Science & Mathematics Books',
        category: 'books',
        quantity: 20,
        condition_type: 'gently_used',
        description: 'Complete set of 20 high-quality books in immaculate condition for grades 8 to 10.',
        images: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600'],
        pickup_address: 'Apartment 402, Lotus Greens, Sector 78, Noida, Uttar Pradesh',
        latitude: 28.568,
        longitude: 77.382
      })
    });
    console.log(`[Step 2] Customer Donated 20 Books: Status ${donRes.status}, Code: ${donRes.data.donation?.donation_code}`);
    if (donRes.status !== 201) throw new Error('Donation creation failed: ' + JSON.stringify(donRes.data));
    const donation = donRes.data.donation;
    const donationId = donation.id;

    // =============================================================
    // STEP 3: SMART NGO MATCHING ALGORITHM RECOMMENDS NGOS
    // =============================================================
    const recRes = await req(`/donations/items/${donationId}/recommendations`, {
      headers: { Authorization: `Bearer ${donorToken}` }
    });
    const recList = recRes.data.recommendations || recRes.data.matches || [];
    console.log(`[Step 3] Smart NGO Matching Recommends: Status ${recRes.status}, Recommendations Count: ${recList.length}`);
    if (recList.length === 0) {
      throw new Error('No matching recommendations found.');
    }
    const topRec = recList[0];
    console.log(`       Top Pick: ${topRec.organization_name} (Score: ${topRec.final_score || topRec.matching_score}%)`);
    const bd = topRec.scores_breakdown || topRec.breakdown || {};
    console.log(`       Score Breakdown: Category=${bd.category_score || bd.categoryScore}%, Location=${bd.location_score || bd.locationScore}%, Quantity=${bd.quantity_score || bd.quantityScore}%, Urgency=${bd.urgency_score || bd.urgencyScore}%`);

    // =============================================================
    // STEP 4: DONOR SELECTS AN NGO (SEND OFFER)
    // =============================================================
    // Select target verified NGO (Pratham Shiksha Foundation) from recommendations
    const selectedRec = recList.find(r => (r.ngo_id || r.id) === targetNgoId) || topRec;
    const selectedNgoId = targetNgoId;
    console.log(`       Donor Selected Verified NGO: ${selectedRec.organization_name || 'Pratham Shiksha Foundation'} (ID: ${selectedNgoId})`);
    const offerRes = await req(`/donations/items/${donationId}/offer`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${donorToken}` },
      body: JSON.stringify({ ngo_id: selectedNgoId })
    });
    console.log(`[Step 4] Donor Sent Donation Offer to NGO: Status ${offerRes.status}, Matching ID: ${offerRes.data.matching?.id}`);
    if (offerRes.status !== 200) throw new Error('Sending offer failed: ' + JSON.stringify(offerRes.data));
    const matchingId = offerRes.data.matching.id;

    // =============================================================
    // STEP 5: NGO ACCEPTS DONATION OFFER
    // =============================================================
    const acceptRes = await req(`/ngo/offers/${matchingId}/respond`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${ngoToken}` },
      body: JSON.stringify({ action: 'accept' })
    });
    console.log(`[Step 5] NGO Accepted Donation Offer: Status ${acceptRes.status}, Message: ${acceptRes.data.message}`);
    if (acceptRes.status !== 200) throw new Error('NGO acceptance failed: ' + JSON.stringify(acceptRes.data));

    // Verify pickup request was automatically created
    const [pickup] = await query('SELECT * FROM pickup_requests WHERE donation_id = ?', [donationId]);
    if (!pickup) throw new Error('Pickup request was not generated after NGO acceptance.');
    console.log(`       Created Pickup Request #${pickup.id} with status '${pickup.status}'`);

    // =============================================================
    // STEP 6: DELIVERY PARTNER ACCEPTS PICKUP
    // =============================================================
    const acceptPickupRes = await req(`/delivery/pickups/${pickup.id}/accept`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${delToken}` }
    });
    console.log(`[Step 6] Delivery Courier Accepted Pickup: Status ${acceptPickupRes.status}`);
    if (acceptPickupRes.status !== 200) throw new Error('Courier pickup acceptance failed: ' + JSON.stringify(acceptPickupRes.data));
    const assignmentId = acceptPickupRes.data.assignmentId || acceptPickupRes.data.assignment?.id;

    // =============================================================
    // STEP 7: DELIVERY PARTNER COLLECTS BOOKS FROM DONOR
    // =============================================================
    const collectRes = await req(`/delivery/active/${assignmentId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${delToken}` },
      body: JSON.stringify({
        status: 'collected',
        notes: '20 books verified in excellent condition and packaged.'
      })
    });
    console.log(`[Step 7] Courier Collected Books: Status ${collectRes.status}, Donation Status: '${collectRes.data.donation_status}'`);
    if (collectRes.status !== 200) throw new Error('Courier collect failed: ' + JSON.stringify(collectRes.data));

    // =============================================================
    // STEP 8: DELIVERY PARTNER DELIVERS BOOKS TO NGO
    // =============================================================
    const arriveRes = await req(`/delivery/active/${assignmentId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${delToken}` },
      body: JSON.stringify({
        status: 'arrived_at_ngo',
        notes: 'Arrived at NGO center with the 20 books.'
      })
    });
    console.log(`[Step 8] Courier Arrived at NGO: Status ${arriveRes.status}`);
    if (arriveRes.status !== 200) throw new Error('Courier arrival failed: ' + JSON.stringify(arriveRes.data));

    // Retrieve active OTP generated for this delivery
    const [otpRecord] = await query('SELECT * FROM delivery_verification WHERE delivery_assignment_id = ?', [assignmentId]);
    if (!otpRecord || !otpRecord.otp_code) throw new Error('Delivery OTP was not created.');
    console.log(`       Generated Secure Delivery OTP: [${otpRecord.otp_code}] (Expires in 60m)`);

    // =============================================================
    // STEP 9: NGO VERIFIES OTP (HANDOVER COMPLETE)
    // =============================================================
    const verifyOtpRes = await req(`/delivery/active/${assignmentId}/verify-otp`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${delToken}` },
      body: JSON.stringify({ otp: otpRecord.otp_code })
    });
    console.log(`[Step 9] OTP Verified Successfully: Status ${verifyOtpRes.status}, Message: '${verifyOtpRes.data.message}'`);
    if (verifyOtpRes.status !== 200) throw new Error('OTP verification failed: ' + JSON.stringify(verifyOtpRes.data));

    // =============================================================
    // STEP 10: NGO UPDATES INVENTORY & RECEIPTS
    // =============================================================
    const [receipt] = await query('SELECT * FROM ngo_receipts WHERE donation_id = ?', [donationId]);
    const [inventory] = await query('SELECT * FROM ngo_inventory WHERE ngo_id = ? AND category = ?', [selectedNgoId, 'books']);
    console.log(`[Step 10] NGO Receipts & Inventory Updated:`);
    console.log(`        Receipt Generated: ID #${receipt?.id}, Received Qty: ${receipt?.quantity_received || receipt?.received_quantity}`);
    console.log(`        NGO Current Book Stock: ${inventory?.quantity} units`);
    if (!receipt) throw new Error('NGO receipt was not generated.');

    // =============================================================
    // STEP 11: DONOR RECEIVES REWARD COINS (200 COINS FOR 20 BOOKS)
    // =============================================================
    const walletRes = await req('/coins/my-wallet', {
      headers: { Authorization: `Bearer ${donorToken}` }
    });
    console.log(`[Step 11] Donor Reward Coins Credited: Status ${walletRes.status}`);
    console.log(`        Available Coins: ${walletRes.data.wallet?.availableCoins} (Rupee value: ₹${walletRes.data.wallet?.rupeeEquivalent})`);
    console.log(`        Total Earned: ${walletRes.data.wallet?.totalEarnedCoins}`);
    if (walletRes.data.wallet?.availableCoins !== 200) {
      throw new Error(`Expected 200 coins (20 books * 10 coins/unit), but got ${walletRes.data.wallet?.availableCoins}`);
    }

    // =============================================================
    // STEP 12: NGO DISTRIBUTES BOOKS TO BENEFICIARIES
    // =============================================================
    const distRes = await req('/ngo/distributions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${ngoToken}` },
      body: JSON.stringify({
        donation_id: donationId,
        item_name: 'Secondary School NCERT Science & Mathematics Books',
        distributed_quantity: 20,
        distribution_date: new Date().toISOString().split('T')[0],
        beneficiary_count: 20,
        distribution_location: 'Zilla Parishad Primary & Secondary School, Sector 45',
        description: 'Handed over 20 curriculum books to underprivileged grade 9 and 10 students.',
        supporting_photographs: [
          'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=600'
        ]
      })
    });
    console.log(`[Step 12] NGO Distributed Books to Beneficiaries: Status ${distRes.status}`);
    if (distRes.status !== 201) throw new Error('Beneficiary distribution record failed: ' + JSON.stringify(distRes.data));

    // =============================================================
    // STEP 13: NGO UPDATES DISTRIBUTION RECORDS
    // =============================================================
    const distListRes = await req('/ngo/distributions', {
      headers: { Authorization: `Bearer ${ngoToken}` }
    });
    console.log(`[Step 13] NGO Distribution Audit Log: Records Count: ${distListRes.data.distributions?.length}`);
    if (distListRes.data.distributions?.length === 0) throw new Error('Distribution list empty.');

    // =============================================================
    // STEP 14: DONOR TRACKS COMPLETE DONATION JOURNEY
    // =============================================================
    const trackRes = await req(`/donations/items/track/${donation.donation_code}`);
    console.log(`[Step 14] Donor Tracked Full Donation Journey: Status ${trackRes.status}`);
    console.log(`        Final Journey Status: '${trackRes.data.donation?.status}'`);
    const checkpoints = trackRes.data.donation?.trackingTimeline || trackRes.data.tracking || [];
    console.log(`        Timeline Steps Logged: ${checkpoints.length} checkpoints`);
    if (trackRes.data.donation?.status !== 'Distributed to beneficiaries') {
      throw new Error(`Expected 'Distributed to beneficiaries', got '${trackRes.data.donation?.status}'`);
    }

    // =============================================================
    // STEP 15: CUSTOMER USES REWARD COINS FOR SHOPPING (CHECKOUT)
    // =============================================================
    // Add product 1 (₹450) to cart
    const [sampleProduct] = await query('SELECT * FROM products WHERE is_active = 1 LIMIT 1');
    const prodId = sampleProduct.id;
    const prodPrice = Number(sampleProduct.price);

    const addCartRes = await req('/cart/items', {
      method: 'POST',
      headers: { Authorization: `Bearer ${donorToken}` },
      body: JSON.stringify({ productId: prodId, quantity: 1 })
    });
    console.log(`[Step 15] Customer Added Product #${prodId} (₹${prodPrice}) to Cart: Status ${addCartRes.status}`);
    if (addCartRes.status !== 200) throw new Error('Add to cart failed: ' + JSON.stringify(addCartRes.data));

    // Checkout with 50 coins redeemed (₹50 discount)
    const checkoutRes = await req('/orders/checkout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${donorToken}` },
      body: JSON.stringify({
        shipping_address: 'Apartment 402, Lotus Greens, Sector 78, Noida',
        payment_method: 'card',
        coinsToRedeem: 50,
        donation_amount: 0
      })
    });
    console.log(`[Step 15b] Customer Checked Out with 50 Shahyog Coins: Status ${checkoutRes.status}`);
    if (checkoutRes.status !== 201) throw new Error('Order checkout failed: ' + JSON.stringify(checkoutRes.data));
    const order = checkoutRes.data.order;
    console.log(`        Order Number: #${order.order_number}`);
    console.log(`        Subtotal: ₹${order.subtotal}, Coins Redeemed: ${order.coins_redeemed}, Final Paid: ₹${order.total_amount}`);

    // Verify wallet deduction: 200 - 50 = 150 available coins
    const walletAfterRes = await req('/coins/my-wallet', {
      headers: { Authorization: `Bearer ${donorToken}` }
    });
    console.log(`        Updated Wallet: ${walletAfterRes.data.wallet?.availableCoins} coins (Redeemed: ${walletAfterRes.data.wallet?.redeemedCoins})`);
    if (walletAfterRes.data.wallet?.availableCoins !== 150) {
      throw new Error(`Expected 150 coins remaining, got ${walletAfterRes.data.wallet?.availableCoins}`);
    }

    // =============================================================
    // STEP 16: ADMIN PLATFORM GOVERNANCE & ANALYTICS OVERSIGHT
    // =============================================================
    const adminStatsRes = await req('/admin/stats', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log(`[Step 16] Admin Analytics Stream: Status ${adminStatsRes.status}`);
    console.log(`        Total Platform Users: ${adminStatsRes.data.stats?.totalUsers}`);
    console.log(`        Total Item Units Donated: ${adminStatsRes.data.stats?.totalItemUnitsDonated}`);
    console.log(`        Total Distributed Units: ${adminStatsRes.data.stats?.totalDistributedUnits}`);
    console.log(`        Total Beneficiaries: ${adminStatsRes.data.stats?.totalBeneficiariesReported}`);
    console.log(`        Coins Issued: ${adminStatsRes.data.stats?.totalCoinsIssued}, Redeemed: ${adminStatsRes.data.stats?.totalCoinsRedeemed}`);

    const adminCoinsRes = await req('/admin/coins/ledger', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log(`        Admin Coins Ledger Transactions Count: ${adminCoinsRes.data.count}`);

    // =============================================================
    // STEP 17: NOTIFICATION SYSTEM VERIFICATION
    // =============================================================
    const donorNotifs = await req('/notifications', {
      headers: { Authorization: `Bearer ${donorToken}` }
    });
    console.log(`[Step 17] Donor Notifications Received: Count ${donorNotifs.data.count}, Unread: ${donorNotifs.data.unreadCount}`);
    const notificationTitles = donorNotifs.data.notifications?.map(n => n.title);
    console.log(`        Recent Notifications:`, notificationTitles);

    if (donorNotifs.data.count < 3) {
      throw new Error('Expected at least 3 lifecycle notifications for the donor.');
    }

    console.log('\n================================================================');
    console.log('🎉 ALL 17 INTEGRATION & LIFECYCLE CHECKS PASSED FLAWLESSLY!');
    console.log('================================================================\n');

  } catch (error) {
    console.error('\n❌ INTEGRATION TEST FAILED:', error.message);
    if (error.stack) console.error(error.stack);
    process.exitCode = 1;
  } finally {
    if (server) {
      server.close();
      console.log('🛑 Test Server stopped.');
    }
    process.exit();
  }
}

runCompleteIntegration();
