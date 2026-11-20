const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const { query, pool } = require('../config/db');

async function runPhase4Migration() {
  console.log('🚀 Starting Shahyog Kart Phase 4 Database Migration...');

  try {
    const rawSql = fs.readFileSync(path.resolve(__dirname, '../config/schema_phase4.sql'), 'utf8');
    const cleanSql = rawSql.replace(/--[^\r\n]*/g, '');
    const statements = cleanSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const sql of statements) {
      await pool.query(sql);
    }
    console.log('✅ Phase 4 Tables created successfully.');

    // Seed sample notifications if empty
    const [existingCount] = await query('SELECT COUNT(*) as cnt FROM notifications');
    if (existingCount.cnt === 0) {
      const users = await query('SELECT id, role, name FROM users');
      for (const u of users) {
        if (u.role === 'customer') {
          await query(
            `INSERT INTO notifications (user_id, title, message, type, is_read)
             VALUES (?, 'Welcome to Shahyog Kart!', 'Shop ethical rural artisan goods and schedule doorstep pickups for your donations.', 'system', 0),
                    (?, 'Reward Coins Credited!', 'You earned Shahyog Coins for your verified donation. Redeem them in the shop.', 'reward', 0)`,
            [u.id, u.id]
          );
        } else if (u.role === 'ngo') {
          await query(
            `INSERT INTO notifications (user_id, title, message, type, is_read)
             VALUES (?, 'New Donation Matched!', 'A donor has matched items to your published community requirements.', 'donation', 0),
                    (?, 'Courier Dispatched', 'A delivery partner has accepted doorstep pickup and is en route.', 'delivery', 0)`,
            [u.id, u.id]
          );
        } else if (u.role === 'delivery') {
          await query(
            `INSERT INTO notifications (user_id, title, message, type, is_read)
             VALUES (?, 'New Pickup Available', 'A new verified donation pickup request is waiting in your territory.', 'delivery', 0)`,
            [u.id]
          );
        } else if (u.role === 'admin') {
          await query(
            `INSERT INTO notifications (user_id, title, message, type, is_read)
             VALUES (?, 'Admin System Ready', 'Phase 4 Complete: Full platform analytics, NGO verification, and delivery monitoring active.', 'system', 0)`,
            [u.id]
          );
        }
      }
      console.log('✅ Seeded initial notifications for all roles.');
    }

    console.log('\n🎉 Phase 4 Database Migration Completed Successfully!\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Phase 4 Migration failed:', err);
    process.exit(1);
  }
}

runPhase4Migration();
