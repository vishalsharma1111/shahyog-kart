const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const { query, pool } = require('../config/db');

// Helper to check column existence in MySQL
async function ensureColumn(table, column, definition) {
  const [cols] = await pool.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  if (!cols || cols.length === 0) {
    console.log(`➕ Adding column ${column} to table ${table}...`);
    await pool.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  } else {
    console.log(`✓ Column ${column} already exists on ${table}.`);
  }
}

async function runPhase3Migration() {
  console.log('🚀 Starting Shahyog Kart Phase 3 Database Migration...');

  try {
    // 1. Ensure columns on users table
    await ensureColumn('users', 'reward_coins', 'INT DEFAULT 0');
    await ensureColumn('users', 'total_coins_earned', 'INT DEFAULT 0');
    await ensureColumn('users', 'total_coins_redeemed', 'INT DEFAULT 0');

    // 2. Ensure columns on orders table
    await ensureColumn('orders', 'coins_redeemed', 'INT DEFAULT 0');
    await ensureColumn('orders', 'coin_discount', 'DECIMAL(10, 2) DEFAULT 0.00');

    // 3. Ensure columns on donations table
    await ensureColumn('donations', 'delivery_partner_id', 'INT NULL');
    await ensureColumn('donations', 'pickup_request_id', 'INT NULL');
    await ensureColumn('donations', 'coins_awarded', 'INT DEFAULT 0');
    await ensureColumn('donations', 'distributed_at', 'TIMESTAMP NULL');

    // 4. Execute Phase 3 DDL schema
    const rawSql = fs.readFileSync(path.resolve(__dirname, '../config/schema_phase3.sql'), 'utf8');
    const cleanSql = rawSql.replace(/--[^\r\n]*/g, '');
    const statements = cleanSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const sql of statements) {
      await pool.query(sql);
    }
    console.log('✅ Phase 3 Tables created successfully.');

    // 5. Seed Delivery Partner for delivery@shahyogkart.com
    const [delUser] = await query("SELECT id, name FROM users WHERE email = 'delivery@shahyogkart.com'");
    if (delUser) {
      const [existingPartner] = await query('SELECT id FROM delivery_partners WHERE user_id = ?', [delUser.id]);
      if (!existingPartner) {
        await query(
          `INSERT INTO delivery_partners (
            user_id, vehicle_type, vehicle_number, driving_license_number,
            current_city, current_latitude, current_longitude, is_available, total_deliveries, rating
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            delUser.id,
            'Electric Cargo Two-Wheeler',
            'DL-01-EV-4422',
            'DL-20220918239',
            'Delhi',
            28.6139,
            77.2090,
            true,
            14,
            4.95
          ]
        );
        console.log('✅ Seeded Delivery Partner record for Vikram Singh (delivery@shahyogkart.com).');
      } else {
        console.log('✓ Delivery partner record already exists.');
      }
    }

    // 6. Seed Configurable Reward Rules (Matches prompt specifications)
    const initialRewardRules = [
      { category: 'Books', coins_per_unit: 10, description: '10 Coins per Book (e.g. 5 Books = 50 Coins)' },
      { category: 'Clothes', coins_per_unit: 20, description: '20 Coins per Unit (e.g. 2 Jackets = 40 Coins)' },
      { category: 'Shoes', coins_per_unit: 10, description: '10 Coins per Pair (e.g. 5 Pairs = 50 Coins)' },
      { category: 'Stationery', coins_per_unit: 3, description: '3 Coins per Item (e.g. 10 Notebooks = 30 Coins)' },
      { category: 'Toys', coins_per_unit: 8, description: '8 Coins per Educational Toy' },
      { category: 'Blankets', coins_per_unit: 25, description: '25 Coins per Thermal Blanket' },
      { category: 'Food', coins_per_unit: 5, description: '5 Coins per Ration Kit / Dry Food Unit' },
      { category: 'Household essentials', coins_per_unit: 12, description: '12 Coins per Household Utility Item' },
      { category: 'Default', coins_per_unit: 5, description: '5 Coins per general verified donated unit' }
    ];

    for (const rule of initialRewardRules) {
      const [existingRule] = await query('SELECT id FROM reward_rules WHERE category = ?', [rule.category]);
      if (!existingRule) {
        await query(
          `INSERT INTO reward_rules (category, coins_per_unit, description, is_active)
           VALUES (?, ?, ?, 1)`,
          [rule.category, rule.coins_per_unit, rule.description]
        );
      }
    }
    console.log(`✅ Seeded ${initialRewardRules.length} configurable Reward Rules.`);

    // 7. Auto-generate pickup requests for existing accepted donations if any lack one
    const acceptedDonations = await query(`
      SELECT d.*, n.organization_name, n.address as ngo_address, n.city as ngo_city, n.latitude as ngo_lat, n.longitude as ngo_lng
      FROM donations d
      JOIN ngos n ON d.matched_ngo_id = n.id
      WHERE d.status IN ('NGO Accepted', 'Pickup Assigned') AND d.id NOT IN (SELECT donation_id FROM pickup_requests)
    `);

    for (const don of acceptedDonations) {
      const randCode = Math.floor(1000 + Math.random() * 9000);
      const requestCode = `PKP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${randCode}`;
      await query(
        `INSERT INTO pickup_requests (
          request_code, donation_id, ngo_id, status, priority,
          donor_name, donor_phone, pickup_address, pickup_city, pickup_latitude, pickup_longitude,
          ngo_name, ngo_address, ngo_city, ngo_latitude, ngo_longitude,
          package_category, package_item_name, package_quantity, scheduled_pickup_date, notes
        ) VALUES (?, ?, ?, 'Pending', 'Normal', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), ?)`,
        [
          requestCode,
          don.id,
          don.matched_ngo_id,
          don.donor_name || 'Generous Donor',
          don.donor_phone || '9876543210',
          don.pickup_address,
          don.pickup_city || 'Delhi',
          don.pickup_latitude || 28.6139,
          don.pickup_longitude || 77.2090,
          don.organization_name,
          don.ngo_address || 'NGO Center',
          don.ngo_city || 'Delhi',
          don.ngo_lat || 28.6139,
          don.ngo_lng || 77.2090,
          don.category,
          don.item_name,
          don.quantity,
          'Auto-migrated pickup request from Phase 2 accepted donation.'
        ]
      );
      console.log(`✅ Created pickup request ${requestCode} for donation #${don.id}`);
    }

    console.log('\n🎉 Phase 3 Database Migration & Seeding Completed Successfully!\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Phase 3 Migration failed:', err);
    process.exit(1);
  }
}

runPhase3Migration();
