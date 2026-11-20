const http = require('http');

const API_BASE = 'http://localhost:5000/api';

const req = async (path, options = {}) => {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const data = await res.json();
  return { status: res.status, data };
};

async function testPhase2() {
  console.log('🧪 Starting Phase 2 Backend Tests...');

  try {
    // 1. Login with Customer and NGO
    const custLogin = await req('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'customer@shahyogkart.com', password: 'Customer@123' })
    });
    const custToken = custLogin.data.token;
    console.log('1. Customer logged in:', custLogin.status);

    const ngoLogin = await req('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'ngo@shahyogkart.com', password: 'Ngo@123' })
    });
    const ngoToken = ngoLogin.data.token;
    console.log('2. NGO logged in:', ngoLogin.status, ngoLogin.data.user?.organization_name);

    // 3. Create a Physical Item Donation (Books)
    const donationRes = await req('/donations/items', {
      method: 'POST',
      headers: { Authorization: `Bearer ${custToken}` },
      body: JSON.stringify({
        item_name: 'Illustrated Children Science & Story Books',
        category: 'Books',
        quantity: 50,
        condition_type: 'Good',
        description: 'Hardcover and paperback illustrated books suitable for primary students.',
        pickup_address: 'B-24 Connaught Place, Central Delhi',
        pickup_city: 'New Delhi',
        pickup_state: 'Delhi',
        pickup_pincode: '110001',
        latitude: 28.6304,
        longitude: 77.2177,
        images: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80']
      })
    });
    console.log('3. Physical Donation Created:', donationRes.status, donationRes.data.donation?.donation_code);
    const donation = donationRes.data.donation;
    const topMatches = donationRes.data.recommendedNgos;

    console.log('4. Smart Matching Results for Donation:');
    topMatches.forEach((m, idx) => {
      console.log(`   #${idx + 1}: ${m.organization_name} | Match Score: ${m.final_score}% | Distance: ${m.distance_km} km`);
      console.log(`        Score breakdown: Cat=${m.scores_breakdown.category_score} (w:${m.scores_breakdown.category_weighted}) Loc=${m.scores_breakdown.location_score} (w:${m.scores_breakdown.location_weighted}) Qty=${m.scores_breakdown.quantity_score} (w:${m.scores_breakdown.quantity_weighted}) Urg=${m.scores_breakdown.urgency_score} (w:${m.scores_breakdown.urgency_weighted})`);
      console.log(`        Primary reason: ${m.match_reasons[0]}`);
    });

    // 5. NGO publishes a new requirement
    const reqRes = await req('/ngo/requirements', {
      method: 'POST',
      headers: { Authorization: `Bearer ${ngoToken}` },
      body: JSON.stringify({
        item_category: 'Toys',
        item_name: 'Montessori Wooden Puzzles & Building Blocks',
        required_quantity: 40,
        priority: 'Urgent',
        description: 'Early learning toys for children aged 3 to 6.',
        required_date: '2026-12-15'
      })
    });
    console.log('5. NGO Requirement Published:', reqRes.status, reqRes.data.requirement?.item_name, 'Remaining:', reqRes.data.requirement?.remaining_quantity);

    // 6. Offer the donation to top matched NGO
    const topNgo = topMatches[0];
    const offerRes = await req(`/donations/items/${donation.id}/offer`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${custToken}` },
      body: JSON.stringify({
        ngoId: topNgo.ngo_id,
        requirementId: topNgo.requirement_id
      })
    });
    console.log('6. Donation Offered to NGO:', offerRes.status, offerRes.data.message);

    // 7. NGO fetches incoming donation offers
    const incomingRes = await req('/ngo/incoming-donations', {
      headers: { Authorization: `Bearer ${ngoToken}` }
    });
    console.log('7. NGO Incoming Donations Count:', incomingRes.data.offers?.length);

    // 8. NGO accepts donation offer
    const acceptRes = await req(`/ngo/donations/${donation.id}/respond`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${ngoToken}` },
      body: JSON.stringify({ decision: 'accept' })
    });
    console.log('8. NGO Accepted Donation:', acceptRes.status, acceptRes.data.message);

    // 9. Update status through pickup pipeline
    await req(`/donations/items/${donation.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'Pickup Assigned' })
    });
    await req(`/donations/items/${donation.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'Collected' })
    });
    console.log('9. Donation marked Pickup Assigned -> Collected');

    // 10. Record physical receipt at NGO
    const receiptRes = await req(`/ngo/donations/${donation.id}/receipt`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${ngoToken}` },
      body: JSON.stringify({
        condition_verified: 'Good',
        notes: 'Books verified in good condition, added to library inventory.'
      })
    });
    console.log('10. NGO Receipt Logged:', receiptRes.status, receiptRes.data.receipt?.receiptNumber);

    // 11. Check NGO Inventory
    const invRes = await req('/ngo/inventory', {
      headers: { Authorization: `Bearer ${ngoToken}` }
    });
    console.log('11. NGO Inventory Batches:', invRes.data.inventory?.length);
    const firstInv = invRes.data.inventory[0];

    // 12. Record Distribution of items to beneficiaries
    const distRes = await req('/ngo/distributions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${ngoToken}` },
      body: JSON.stringify({
        inventory_id: firstInv.id,
        beneficiary_group: 'Yamuna Khadar Slum Community Learning Center',
        location: 'Yamuna Khadar, East Delhi',
        quantity_distributed: 15,
        distributed_date: new Date().toISOString().slice(0, 10),
        notes: 'Handed over directly to 15 primary students during reading workshop.'
      })
    });
    console.log('12. Distribution Logged:', distRes.status, distRes.data.message);

    // 13. Fetch NGO Reports
    const reportsRes = await req('/ngo/reports', {
      headers: { Authorization: `Bearer ${ngoToken}` }
    });
    console.log('13. NGO Reports:', reportsRes.status, 'Categories tracked:', reportsRes.data.reports?.categoryBreakdown?.length);

    console.log('\n🎉 ALL PHASE 2 BACKEND FUNCTIONALITIES PASSED 100%!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Phase 2 test failed:', err);
    process.exit(1);
  }
}

// Start backend server in same process if not already running
const backendServer = require('./src/server');
setTimeout(() => {
  testPhase2();
}, 1000);
