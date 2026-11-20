const mysql = require('mysql2/promise');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

async function deployToTiDB() {
  console.log('========================================================================');
  console.log('🌐 SHAHYOG KART - TIDB CLOUD STARTER VERIFICATION & SCHEMA DEPLOYMENT');
  console.log('========================================================================\n');

  const config = {
    host: process.env.TIDB_HOST || process.env.DATABASE_HOST || 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
    port: parseInt(process.env.TIDB_PORT || process.env.DATABASE_PORT || '4000', 10),
    user: process.env.TIDB_USER || process.env.DATABASE_USER,
    password: process.env.TIDB_PASSWORD || process.env.DATABASE_PASSWORD,
    database: process.env.TIDB_DATABASE || process.env.DATABASE_NAME || 'shahyog_kart',
    ssl: {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: false
    }
  };

  if (!config.user || !config.password) {
    console.log('⚠️ Notice: TiDB Cloud credentials not detected in environment.');
    console.log('To connect to TiDB Cloud Serverless, configure in Render or backend/.env:');
    console.log('  TIDB_HOST=<your-cluster-host>.tidbcloud.com');
    console.log('  TIDB_PORT=4000');
    console.log('  TIDB_USER=<your-cluster-prefix>.root');
    console.log('  TIDB_PASSWORD=<your-password>');
    console.log('  TIDB_DATABASE=shahyog_kart\n');
    return;
  }

  console.log(`Connecting to TiDB Cloud Cluster at ${config.host}:${config.port}...`);
  let connection;
  try {
    connection = await mysql.createConnection(config);
    console.log('✅ Successfully connected to TiDB Cloud over TLS/SSL!\n');

    // Check TiDB version
    const [versionRows] = await connection.query('SELECT VERSION() as version');
    console.log(`📊 TiDB Version: ${versionRows[0]?.version}`);

    // Create database if needed
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${config.database}\``);
    await connection.query(`USE \`${config.database}\``);

    console.log('Checking & verifying schema on TiDB Cloud...');

    // 1. users
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NULL,
        google_id VARCHAR(100) NULL UNIQUE,
        avatar_url VARCHAR(500) NULL,
        role ENUM('customer', 'seller', 'ngo', 'delivery', 'admin') DEFAULT 'customer',
        status VARCHAR(50) DEFAULT 'approved',
        organization_name VARCHAR(255) NULL,
        phone VARCHAR(50) NULL,
        reward_coins INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_role_status (role, status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. ngos
    await connection.query(`
      CREATE TABLE IF NOT EXISTS ngos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        organization_name VARCHAR(200) NOT NULL,
        registration_number VARCHAR(100) NOT NULL,
        cause_area VARCHAR(100) DEFAULT 'General Relief',
        description TEXT,
        target_amount DECIMAL(12, 2) DEFAULT 100000.00,
        raised_amount DECIMAL(12, 2) DEFAULT 0.00,
        verified_by_admin TINYINT(1) DEFAULT 0,
        website VARCHAR(255),
        image_url VARCHAR(500),
        address VARCHAR(255),
        contact_person VARCHAR(150),
        phone VARCHAR(30),
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        city VARCHAR(100),
        state VARCHAR(100),
        accepted_categories JSON,
        supporting_documents JSON,
        capacity_limit INT DEFAULT 1000,
        current_load INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_ngo_user (user_id),
        INDEX idx_ngo_verified (verified_by_admin)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 3. fundraising_campaigns
    await connection.query(`
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
        INDEX idx_ngo_camp (ngo_id),
        INDEX idx_camp_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 4. fund_donations
    await connection.query(`
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
        INDEX idx_fd_txn (transaction_id),
        INDEX idx_fd_status (payment_status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 5. audit_logs
    await connection.query(`
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
        INDEX idx_audit_action (action)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 6. contact_inquiries
    await connection.query(`
      CREATE TABLE IF NOT EXISTS contact_inquiries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NULL,
        subject VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'new',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('✅ TiDB Cloud schema verification completed with zero errors.');

    const [tables] = await connection.query('SHOW TABLES');
    console.log(`📋 Total tables verified on TiDB Cloud: ${tables.length}`);

  } catch (error) {
    console.error('❌ TiDB Cloud deployment check error:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

deployToTiDB();
