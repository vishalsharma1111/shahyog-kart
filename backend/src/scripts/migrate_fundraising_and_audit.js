const { query, pool } = require('../config/db');

async function migrateFundraisingAndAudit() {
  console.log('🔄 Running Migration: Fundraising Campaigns, Fund Payments, and Audit Logs...');

  try {
    // 1. Fundraising Campaigns Table
    await query(`
      CREATE TABLE IF NOT EXISTS fundraising_campaigns (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ngo_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        fundraising_goal DECIMAL(12, 2) NOT NULL,
        amount_raised DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        status ENUM('pending', 'active', 'completed', 'cancelled') NOT NULL DEFAULT 'active',
        supporting_documents TEXT NULL,
        photographs TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_ngo_id (ngo_id),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ Table fundraising_campaigns created or verified.');

    // 2. Fund Donations / Verified Payments Table
    await query(`
      CREATE TABLE IF NOT EXISTS fund_donations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        transaction_id VARCHAR(100) NOT NULL UNIQUE,
        campaign_id INT NULL,
        ngo_id INT NOT NULL,
        donor_id INT NULL,
        donor_name VARCHAR(255) NOT NULL,
        donor_email VARCHAR(255) NOT NULL,
        amount DECIMAL(12, 2) NOT NULL,
        payment_gateway_ref VARCHAR(100) NOT NULL UNIQUE,
        payment_status ENUM('pending', 'completed', 'failed') NOT NULL DEFAULT 'pending',
        payment_method VARCHAR(50) NOT NULL DEFAULT 'online',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        verified_at TIMESTAMP NULL,
        INDEX idx_trans_id (transaction_id),
        INDEX idx_campaign (campaign_id),
        INDEX idx_ngo (ngo_id),
        INDEX idx_status (payment_status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ Table fund_donations created or verified.');

    // 3. Audit Logs Table
    await query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id INT NULL,
        previous_value JSON NULL,
        new_value JSON NULL,
        ip_address VARCHAR(45) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user (user_id),
        INDEX idx_action (action),
        INDEX idx_entity (entity_type, entity_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ Table audit_logs created or verified.');

    console.log('🎉 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

migrateFundraisingAndAudit();
