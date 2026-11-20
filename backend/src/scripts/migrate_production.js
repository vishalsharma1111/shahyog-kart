const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const { query } = require('../config/db');

async function runMigration() {
  console.log('🔄 Running Shahyog Kart Production Database Migration...');

  try {
    // 1. Add google_id and avatar_url to users table if they do not exist
    const columns = await query('SHOW COLUMNS FROM users');
    const columnNames = columns.map(c => c.Field);

    if (!columnNames.includes('google_id')) {
      console.log('Adding google_id column to users table...');
      await query('ALTER TABLE users ADD COLUMN google_id VARCHAR(100) NULL AFTER email');
      await query('CREATE UNIQUE INDEX idx_users_google_id ON users(google_id)');
    }

    if (!columnNames.includes('avatar_url')) {
      console.log('Adding avatar_url column to users table...');
      await query('ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500) NULL AFTER organization_name');
    }

    // 2. Allow password to be NULL for Google OAuth accounts
    console.log('Modifying password column to allow NULL for Google SSO accounts...');
    await query('ALTER TABLE users MODIFY COLUMN password VARCHAR(255) NULL');

    // 3. Ensure status column can accommodate all operational statuses ('pending', 'approved', 'rejected', 'suspended')
    console.log('Updating status column on users table...');
    await query("ALTER TABLE users MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'approved'");

    // 4. Create contact_inquiries table for Page 5 Contact Form if not exists
    console.log('Ensuring contact_inquiries table exists...');
    await query(`
      CREATE TABLE IF NOT EXISTS contact_inquiries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        email VARCHAR(191) NOT NULL,
        phone VARCHAR(30) NULL,
        subject VARCHAR(200) NOT NULL,
        message TEXT NOT NULL,
        status ENUM('new', 'read', 'resolved') DEFAULT 'new',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('✅ Production Database Migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

runMigration();
