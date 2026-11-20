const { query } = require('../config/db');

/**
 * Calculate geographical distance in kilometers using the Haversine formula
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 50.0; // Default fallback distance

  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
}

/**
 * Compute location proximity score based on kilometer distance (0 - 100)
 */
function computeLocationScore(distanceKm) {
  if (distanceKm <= 10) return 100;
  if (distanceKm <= 25) return 85;
  if (distanceKm <= 50) return 70;
  if (distanceKm <= 100) return 50;
  if (distanceKm <= 250) return 30;
  return 10;
}

/**
 * Smart NGO Matching Algorithm
 * Weights:
 * - Category Match: 40% (0.40)
 * - Location Proximity: 25% (0.25)
 * - Quantity Match: 20% (0.20)
 * - Urgency: 15% (0.15)
 * Formula: Final Score = (Category * 0.40) + (Location * 0.25) + (Quantity * 0.20) + (Urgency * 0.15)
 */
async function matchNgosForDonation(donation) {
  // 1. Fetch only verified NGOs with capacity
  const ngos = await query(`
    SELECT n.*, u.status as user_status
    FROM ngos n
    LEFT JOIN users u ON n.user_id = u.id
    WHERE n.verified_by_admin = 1 AND (u.status IS NULL OR u.status = 'approved')
  `);

  // 2. Fetch all active NGO requirements matching the donation category
  const requirements = await query(`
    SELECT nr.*, n.organization_name
    FROM ngo_requirements nr
    JOIN ngos n ON nr.ngo_id = n.id
    WHERE nr.status = 'Active' AND nr.item_category = ?
  `, [donation.category]);

  const donorLat = parseFloat(donation.latitude) || 28.6139; // Default Delhi if not set
  const donorLng = parseFloat(donation.longitude) || 77.2090;
  const donationQty = parseInt(donation.quantity, 10) || 1;

  const results = [];

  for (const ngo of ngos) {
    // Parse accepted categories
    let acceptedCategories = [];
    try {
      if (typeof ngo.accepted_categories === 'string') {
        acceptedCategories = JSON.parse(ngo.accepted_categories);
      } else if (Array.isArray(ngo.accepted_categories)) {
        acceptedCategories = ngo.accepted_categories;
      }
    } catch (e) {
      acceptedCategories = [];
    }

    // Find best requirement matching this donation
    const ngoReqs = requirements.filter(r => r.ngo_id === ngo.id);
    const bestReq = ngoReqs.length > 0
      ? ngoReqs.sort((a, b) => {
          const prioMap = { Urgent: 4, High: 3, Medium: 2, Low: 1 };
          return (prioMap[b.priority] || 1) - (prioMap[a.priority] || 1);
        })[0]
      : null;

    // Check category acceptance
    const acceptsCategory =
      bestReq !== null ||
      acceptedCategories.map(c => c.toLowerCase()).includes(donation.category.toLowerCase());

    if (!acceptsCategory) {
      continue; // Skip NGOs that do not accept this category
    }

    // Check capacity limit
    const availableCapacity = Math.max(0, (ngo.capacity_limit || 1000) - (ngo.current_load || 0));
    if (availableCapacity <= 0) {
      continue; // Skip NGOs with zero remaining capacity
    }

    // A. CATEGORY SCORE (40% Weight)
    let categoryScore = 0;
    let categoryReason = '';
    if (bestReq) {
      categoryScore = 100;
      categoryReason = `Exact active demand: NGO posted requirement for "${bestReq.item_name}" (${donation.category})`;
    } else {
      categoryScore = 75;
      categoryReason = `Category accepted: NGO profile formally accepts "${donation.category}" goods`;
    }

    // B. LOCATION PROXIMITY SCORE (25% Weight)
    const ngoLat = parseFloat(ngo.latitude) || 28.6139;
    const ngoLng = parseFloat(ngo.longitude) || 77.2090;
    const distanceKm = calculateHaversineDistance(donorLat, donorLng, ngoLat, ngoLng);
    const locationScore = computeLocationScore(distanceKm);
    const locationReason = `Distance: ${distanceKm} km from pickup in ${ngo.city || 'local cluster'} (${locationScore}/100 proximity rating)`;

    // C. QUANTITY MATCH SCORE (20% Weight)
    let quantityScore = 0;
    let quantityReason = '';
    if (bestReq) {
      const remQty = bestReq.remaining_quantity;
      if (donationQty <= remQty) {
        quantityScore = 100;
        quantityReason = `Optimal quantity match: Donation of ${donationQty} units directly fulfills remaining need of ${remQty}`;
      } else {
        const excess = donationQty - remQty;
        quantityScore = Math.max(50, Math.round(100 - (excess / remQty) * 40));
        quantityReason = `Surplus donation: Donation of ${donationQty} units exceeds remaining need of ${remQty} by ${excess} units`;
      }
    } else {
      if (donationQty <= availableCapacity) {
        quantityScore = 75;
        quantityReason = `Capacity available: NGO has space for ${availableCapacity} units (donation: ${donationQty} units)`;
      } else {
        quantityScore = 40;
        quantityReason = `Capacity stretched: Available capacity is ${availableCapacity} units`;
      }
    }

    // D. URGENCY SCORE (15% Weight)
    let urgencyScore = 50; // Default
    let urgencyReason = 'Standard priority category allocation';
    if (bestReq) {
      const urgencyMap = {
        Urgent: 100,
        High: 80,
        Medium: 60,
        Low: 40
      };
      urgencyScore = urgencyMap[bestReq.priority] || 50;
      urgencyReason = `Requirement priority is flagged as "${bestReq.priority}" (${urgencyScore}/100)`;
    }

    // FINAL SCORE FORMULA: (Category * 0.40) + (Location * 0.25) + (Quantity * 0.20) + (Urgency * 0.15)
    const categoryWeighted = categoryScore * 0.40;
    const locationWeighted = locationScore * 0.25;
    const quantityWeighted = quantityScore * 0.20;
    const urgencyWeighted = urgencyScore * 0.15;

    const finalScore = parseFloat((categoryWeighted + locationWeighted + quantityWeighted + urgencyWeighted).toFixed(1));

    const matchReasons = [
      categoryReason,
      locationReason,
      quantityReason,
      urgencyReason
    ];

    results.push({
      ngo_id: ngo.id,
      organization_name: ngo.organization_name,
      cause_area: ngo.cause_area,
      city: ngo.city,
      state: ngo.state,
      contact_person: ngo.contact_person,
      phone: ngo.phone,
      distance_km: distanceKm,
      requirement_id: bestReq ? bestReq.id : null,
      matched_requirement_name: bestReq ? bestReq.item_name : null,
      requirement_priority: bestReq ? bestReq.priority : null,
      final_score: finalScore,
      scores_breakdown: {
        category_score: categoryScore,
        location_score: locationScore,
        quantity_score: quantityScore,
        urgency_score: urgencyScore,
        category_weighted: parseFloat(categoryWeighted.toFixed(2)),
        location_weighted: parseFloat(locationWeighted.toFixed(2)),
        quantity_weighted: parseFloat(quantityWeighted.toFixed(2)),
        urgency_weighted: parseFloat(urgencyWeighted.toFixed(2))
      },
      match_reasons: matchReasons
    });
  }

  // Sort by finalScore descending
  results.sort((a, b) => b.final_score - a.final_score);
  return results;
}

module.exports = {
  calculateHaversineDistance,
  computeLocationScore,
  matchNgosForDonation
};
