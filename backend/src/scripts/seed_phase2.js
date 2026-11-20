const mysql = require('mysql2/promise');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function migrateAndSeedPhase2() {
  console.log('🚀 Starting Phase 2 Database Migration & Seeding...');

  const db = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'VISHAL',
    database: process.env.DB_NAME || 'shahyog_kart',
    multipleStatements: true
  });

  // Helper to add column if it doesn't exist
  const addColumnIfNotExists = async (tableName, columnName, columnDefinition) => {
    const [cols] = await db.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
      [process.env.DB_NAME || 'shahyog_kart', tableName, columnName]
    );
    if (cols.length === 0) {
      await db.query(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${columnDefinition}`);
      console.log(`  + Added column \`${columnName}\` to \`${tableName}\``);
    }
  };

  // 1. Enhance ngos table
  console.log('Migrating ngos table...');
  await addColumnIfNotExists('ngos', 'contact_person', 'VARCHAR(150) DEFAULT NULL');
  await addColumnIfNotExists('ngos', 'phone', 'VARCHAR(30) DEFAULT NULL');
  await addColumnIfNotExists('ngos', 'latitude', 'DECIMAL(10, 8) DEFAULT 28.61390000');
  await addColumnIfNotExists('ngos', 'longitude', 'DECIMAL(11, 8) DEFAULT 77.20900000');
  await addColumnIfNotExists('ngos', 'city', "VARCHAR(100) DEFAULT 'New Delhi'");
  await addColumnIfNotExists('ngos', 'state', "VARCHAR(100) DEFAULT 'Delhi'");
  await addColumnIfNotExists('ngos', 'accepted_categories', 'JSON DEFAULT NULL');
  await addColumnIfNotExists('ngos', 'supporting_documents', 'JSON DEFAULT NULL');
  await addColumnIfNotExists('ngos', 'capacity_limit', 'INT DEFAULT 1000');
  await addColumnIfNotExists('ngos', 'current_load', 'INT DEFAULT 0');

  // 2. Enhance donations table
  console.log('Migrating donations table...');
  await db.query('ALTER TABLE `donations` MODIFY COLUMN `amount` DECIMAL(10, 2) NULL DEFAULT NULL');
  await addColumnIfNotExists('donations', 'donation_code', 'VARCHAR(64) DEFAULT NULL');
  await addColumnIfNotExists('donations', 'donation_type', "ENUM('monetary', 'item') NOT NULL DEFAULT 'monetary'");
  await addColumnIfNotExists('donations', 'item_name', 'VARCHAR(255) DEFAULT NULL');
  await addColumnIfNotExists('donations', 'category', 'VARCHAR(100) DEFAULT NULL');
  await addColumnIfNotExists('donations', 'quantity', 'INT DEFAULT 1');
  await addColumnIfNotExists('donations', 'condition_type', "VARCHAR(50) DEFAULT 'Good'");
  await addColumnIfNotExists('donations', 'description', 'TEXT DEFAULT NULL');
  await addColumnIfNotExists('donations', 'pickup_address', 'TEXT DEFAULT NULL');
  await addColumnIfNotExists('donations', 'pickup_city', 'VARCHAR(100) DEFAULT NULL');
  await addColumnIfNotExists('donations', 'pickup_state', 'VARCHAR(100) DEFAULT NULL');
  await addColumnIfNotExists('donations', 'pickup_pincode', 'VARCHAR(20) DEFAULT NULL');
  await addColumnIfNotExists('donations', 'latitude', 'DECIMAL(10, 8) DEFAULT NULL');
  await addColumnIfNotExists('donations', 'longitude', 'DECIMAL(11, 8) DEFAULT NULL');
  await addColumnIfNotExists(
    'donations',
    'status',
    "ENUM('Submitted', 'Under Review', 'Approved', 'NGO Matched', 'NGO Accepted', 'Pickup Assigned', 'Collected', 'Received by NGO', 'Distributed', 'Completed', 'Rejected') NOT NULL DEFAULT 'Submitted'"
  );
  await addColumnIfNotExists('donations', 'matched_ngo_id', 'INT DEFAULT NULL');
  await addColumnIfNotExists('donations', 'rejection_reason', 'TEXT DEFAULT NULL');
  await addColumnIfNotExists('donations', 'distributed_count', 'INT DEFAULT 0');
  await addColumnIfNotExists('donations', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

  // 3. Create Donation Images Table
  await db.query(`
    CREATE TABLE IF NOT EXISTS \`donation_images\` (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`donation_id\` INT NOT NULL,
      \`image_url\` VARCHAR(500) NOT NULL,
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (\`donation_id\`) REFERENCES \`donations\`(\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 4. Create NGO Requirements Table
  await db.query(`
    CREATE TABLE IF NOT EXISTS \`ngo_requirements\` (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`ngo_id\` INT NOT NULL,
      \`item_category\` VARCHAR(100) NOT NULL,
      \`item_name\` VARCHAR(200) NOT NULL,
      \`required_quantity\` INT NOT NULL DEFAULT 1,
      \`received_quantity\` INT NOT NULL DEFAULT 0,
      \`remaining_quantity\` INT GENERATED ALWAYS AS (GREATEST(0, required_quantity - received_quantity)) STORED,
      \`priority\` ENUM('Urgent', 'High', 'Medium', 'Low') NOT NULL DEFAULT 'Medium',
      \`description\` TEXT DEFAULT NULL,
      \`required_date\` DATE DEFAULT NULL,
      \`status\` ENUM('Active', 'Fulfilled', 'Closed') NOT NULL DEFAULT 'Active',
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (\`ngo_id\`) REFERENCES \`ngos\`(\`id\`) ON DELETE CASCADE,
      INDEX \`idx_req_ngo\` (\`ngo_id\`),
      INDEX \`idx_req_category\` (\`item_category\`),
      INDEX \`idx_req_status\` (\`status\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 5. Create NGO Inventory Table
  await db.query(`
    CREATE TABLE IF NOT EXISTS \`ngo_inventory\` (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`ngo_id\` INT NOT NULL,
      \`donation_id\` INT DEFAULT NULL,
      \`category\` VARCHAR(100) NOT NULL,
      \`item_name\` VARCHAR(200) NOT NULL,
      \`quantity\` INT NOT NULL DEFAULT 1,
      \`condition_type\` VARCHAR(50) DEFAULT 'Good',
      \`received_date\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      \`distributed_quantity\` INT NOT NULL DEFAULT 0,
      \`available_quantity\` INT GENERATED ALWAYS AS (GREATEST(0, quantity - distributed_quantity)) STORED,
      \`status\` ENUM('In Stock', 'Partially Distributed', 'Fully Distributed') NOT NULL DEFAULT 'In Stock',
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (\`ngo_id\`) REFERENCES \`ngos\`(\`id\`) ON DELETE CASCADE,
      FOREIGN KEY (\`donation_id\`) REFERENCES \`donations\`(\`id\`) ON DELETE SET NULL,
      INDEX \`idx_inv_ngo\` (\`ngo_id\`),
      INDEX \`idx_inv_cat\` (\`category\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 6. Create Donation Matching Table
  await db.query(`
    CREATE TABLE IF NOT EXISTS \`donation_matching\` (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`donation_id\` INT NOT NULL,
      \`ngo_id\` INT NOT NULL,
      \`requirement_id\` INT DEFAULT NULL,
      \`matching_score\` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
      \`category_score\` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
      \`location_score\` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
      \`quantity_score\` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
      \`urgency_score\` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
      \`status\` ENUM('Offered', 'Accepted', 'Rejected', 'Expired') NOT NULL DEFAULT 'Offered',
      \`rejection_reason\` TEXT DEFAULT NULL,
      \`offered_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      \`responded_at\` TIMESTAMP NULL DEFAULT NULL,
      FOREIGN KEY (\`donation_id\`) REFERENCES \`donations\`(\`id\`) ON DELETE CASCADE,
      FOREIGN KEY (\`ngo_id\`) REFERENCES \`ngos\`(\`id\`) ON DELETE CASCADE,
      FOREIGN KEY (\`requirement_id\`) REFERENCES \`ngo_requirements\`(\`id\`) ON DELETE SET NULL,
      INDEX \`idx_match_don\` (\`donation_id\`),
      INDEX \`idx_match_ngo\` (\`ngo_id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 7. Create Matching Scores Table
  await db.query(`
    CREATE TABLE IF NOT EXISTS \`matching_scores\` (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`matching_id\` INT DEFAULT NULL,
      \`donation_id\` INT NOT NULL,
      \`ngo_id\` INT NOT NULL,
      \`final_score\` DECIMAL(5, 2) NOT NULL,
      \`category_weight_score\` DECIMAL(5, 2) NOT NULL,
      \`location_weight_score\` DECIMAL(5, 2) NOT NULL,
      \`quantity_weight_score\` DECIMAL(5, 2) NOT NULL,
      \`urgency_weight_score\` DECIMAL(5, 2) NOT NULL,
      \`distance_km\` DECIMAL(8, 2) NOT NULL,
      \`match_reasons\` JSON DEFAULT NULL,
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (\`donation_id\`) REFERENCES \`donations\`(\`id\`) ON DELETE CASCADE,
      FOREIGN KEY (\`ngo_id\`) REFERENCES \`ngos\`(\`id\`) ON DELETE CASCADE,
      INDEX \`idx_scores_don\` (\`donation_id\`),
      INDEX \`idx_scores_ngo\` (\`ngo_id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 8. Create NGO Receipts Table
  await db.query(`
    CREATE TABLE IF NOT EXISTS \`ngo_receipts\` (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`ngo_id\` INT NOT NULL,
      \`donation_id\` INT NOT NULL,
      \`donor_id\` INT DEFAULT NULL,
      \`donor_name\` VARCHAR(150) NOT NULL,
      \`receipt_number\` VARCHAR(64) NOT NULL UNIQUE,
      \`item_summary\` VARCHAR(255) NOT NULL,
      \`quantity_received\` INT NOT NULL,
      \`condition_verified\` VARCHAR(50) DEFAULT 'Good',
      \`received_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      \`notes\` TEXT DEFAULT NULL,
      FOREIGN KEY (\`ngo_id\`) REFERENCES \`ngos\`(\`id\`) ON DELETE CASCADE,
      FOREIGN KEY (\`donation_id\`) REFERENCES \`donations\`(\`id\`) ON DELETE CASCADE,
      FOREIGN KEY (\`donor_id\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL,
      INDEX \`idx_rcpt_ngo\` (\`ngo_id\`),
      INDEX \`idx_rcpt_num\` (\`receipt_number\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 9. Create NGO Distributions Table
  await db.query(`
    CREATE TABLE IF NOT EXISTS \`ngo_distributions\` (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`ngo_id\` INT NOT NULL,
      \`inventory_id\` INT DEFAULT NULL,
      \`beneficiary_group\` VARCHAR(200) NOT NULL,
      \`location\` VARCHAR(200) NOT NULL,
      \`quantity_distributed\` INT NOT NULL,
      \`distributed_date\` DATE NOT NULL,
      \`notes\` TEXT DEFAULT NULL,
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (\`ngo_id\`) REFERENCES \`ngos\`(\`id\`) ON DELETE CASCADE,
      FOREIGN KEY (\`inventory_id\`) REFERENCES \`ngo_inventory\`(\`id\`) ON DELETE SET NULL,
      INDEX \`idx_dist_ngo\` (\`ngo_id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  console.log('✅ All Phase 2 tables ready.');

  // Update existing NGOs with coordinates, contacts & accepted categories
  const ngoUpdates = [
    {
      name: 'Pratham Shiksha Foundation',
      contact_person: 'Dr. Sunita Deshmukh',
      phone: '+91 9877001122',
      latitude: 28.6139,
      longitude: 77.2090,
      city: 'New Delhi',
      state: 'Delhi',
      accepted_categories: JSON.stringify(['Books', 'Stationery', 'Toys', 'Clothes']),
      capacity_limit: 2500,
      current_load: 350
    },
    {
      name: 'Annam Hunger Relief Trust',
      contact_person: 'Rajesh Mehra',
      phone: '+91 9822114455',
      latitude: 19.0760,
      longitude: 72.8777,
      city: 'Mumbai',
      state: 'Maharashtra',
      accepted_categories: JSON.stringify(['Food', 'Household essentials', 'Blankets']),
      capacity_limit: 3000,
      current_load: 620
    },
    {
      name: 'Vriksha Dharini Greening Mission',
      contact_person: 'Ananya Rao',
      phone: '+91 9844332211',
      latitude: 12.9716,
      longitude: 77.5946,
      city: 'Bengaluru',
      state: 'Karnataka',
      accepted_categories: JSON.stringify(['Household essentials', 'Books']),
      capacity_limit: 1200,
      current_load: 180
    },
    {
      name: 'Mahila Shakti Artisan Collective',
      contact_person: 'Meenakshi Rathore',
      phone: '+91 9829001144',
      latitude: 26.9124,
      longitude: 75.7873,
      city: 'Jaipur',
      state: 'Rajasthan',
      accepted_categories: JSON.stringify(['Clothes', 'Blankets', 'Shoes', 'Household essentials']),
      capacity_limit: 1800,
      current_load: 410
    }
  ];

  for (const n of ngoUpdates) {
    await db.query(
      `UPDATE ngos
       SET contact_person = ?, phone = ?, latitude = ?, longitude = ?, city = ?, state = ?, accepted_categories = ?, capacity_limit = ?, current_load = ?
       WHERE organization_name LIKE ?`,
      [n.contact_person, n.phone, n.latitude, n.longitude, n.city, n.state, n.accepted_categories, n.capacity_limit, n.current_load, `%${n.name}%`]
    );
  }
  console.log('✅ Existing NGOs updated with location coordinates & category lists.');

  // Insert or ensure Samarpan Child Welfare Trust exists (Delhi-NCR regional hub)
  const [samarpanExist] = await db.query("SELECT id FROM ngos WHERE registration_number = 'NGO-DEL-2022-77441'");
  if (samarpanExist.length === 0) {
    await db.query(
      `INSERT INTO ngos (organization_name, registration_number, cause_area, description, target_amount, raised_amount, verified_by_admin, website, image_url, address, contact_person, phone, latitude, longitude, city, state, accepted_categories, capacity_limit, current_load)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'Samarpan Child & Community Trust',
        'NGO-DEL-2022-77441',
        'Child Welfare & Education',
        'Providing primary education, winter clothing kits, nutritional meal packages, and recreation toys to over 3,500 children across Delhi NCR slums.',
        600000.00,
        415000.00,
        'https://samarpanchildtrust.org',
        'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=600&q=80',
        'B-14 Sector 62, Noida, NCR Delhi - 201301',
        'Sunil Kumar Verma',
        '+91 9810224466',
        28.5355,
        77.3910,
        'Noida',
        'Uttar Pradesh',
        JSON.stringify(['Books', 'Clothes', 'Shoes', 'Toys', 'Blankets', 'Stationery', 'Food', 'Household essentials']),
        2000,
        280
      ]
    );
    console.log('✅ Samarpan Child & Community Trust created.');
  }

  // Seed Active NGO Requirements
  const [allNgos] = await db.query('SELECT id, organization_name FROM ngos');
  const prathamId = allNgos.find(n => n.organization_name.includes('Pratham'))?.id;
  const annamId = allNgos.find(n => n.organization_name.includes('Annam'))?.id;
  const mahilaId = allNgos.find(n => n.organization_name.includes('Mahila'))?.id;
  const samarpanId = allNgos.find(n => n.organization_name.includes('Samarpan'))?.id;

  const requirements = [
    {
      ngo_id: prathamId,
      item_category: 'Books',
      item_name: 'Primary & Middle School Children Storybooks',
      required_quantity: 120,
      received_quantity: 20,
      priority: 'Urgent',
      description: 'Illustrated bilingual Hindi/English storybooks and elementary science books for slum libraries.',
      required_date: new Date(Date.now() + 14 * 86400000)
    },
    {
      ngo_id: prathamId,
      item_category: 'Stationery',
      item_name: 'Student Notebooks & Pen/Pencil Packs',
      required_quantity: 250,
      received_quantity: 50,
      priority: 'High',
      description: 'Ruled notebooks, drawing books, crayons, and geometry sets for primary grades.',
      required_date: new Date(Date.now() + 21 * 86400000)
    },
    {
      ngo_id: annamId,
      item_category: 'Food',
      item_name: 'Dry Ration Packages (Rice, Pulses, Wheat Flour)',
      required_quantity: 300,
      received_quantity: 110,
      priority: 'Urgent',
      description: 'Non-perishable hygienic food staples to feed destitute families and patient relatives.',
      required_date: new Date(Date.now() + 7 * 86400000)
    },
    {
      ngo_id: mahilaId,
      item_category: 'Blankets',
      item_name: 'Thermal Winter Blankets & Quilts',
      required_quantity: 150,
      received_quantity: 40,
      priority: 'Urgent',
      description: 'Heavy fleece or wool blankets for night shelters in rural border villages.',
      required_date: new Date(Date.now() + 10 * 86400000)
    },
    {
      ngo_id: mahilaId,
      item_category: 'Clothes',
      item_name: 'Gently Used Clean Winter Woolens & Sweaters',
      required_quantity: 200,
      received_quantity: 60,
      priority: 'High',
      description: 'Clean sweaters, jackets, and thermal wear for women and children.',
      required_date: new Date(Date.now() + 15 * 86400000)
    },
    {
      ngo_id: samarpanId,
      item_category: 'Shoes',
      item_name: 'Children School Shoes & Sports Footwear',
      required_quantity: 80,
      received_quantity: 15,
      priority: 'Medium',
      description: 'Sturdy black school shoes and canvas sports sneakers in sizes 1 to 6.',
      required_date: new Date(Date.now() + 30 * 86400000)
    },
    {
      ngo_id: samarpanId,
      item_category: 'Toys',
      item_name: 'Educational Board Games & Soft Toys',
      required_quantity: 75,
      received_quantity: 25,
      priority: 'Low',
      description: 'Building blocks, jigsaw puzzles, and clean plush toys for early learning centers.',
      required_date: new Date(Date.now() + 45 * 86400000)
    }
  ];

  for (const r of requirements) {
    if (r.ngo_id) {
      const [existing] = await db.query(
        'SELECT id FROM ngo_requirements WHERE ngo_id = ? AND item_name = ?',
        [r.ngo_id, r.item_name]
      );
      if (existing.length === 0) {
        await db.query(
          `INSERT INTO ngo_requirements (ngo_id, item_category, item_name, required_quantity, received_quantity, priority, description, required_date, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Active')`,
          [r.ngo_id, r.item_category, r.item_name, r.required_quantity, r.received_quantity, r.priority, r.description, r.required_date]
        );
      }
    }
  }
  console.log('✅ Active NGO Requirements seeded.');

  // Seed Initial Sample Inventory for Pratham
  if (prathamId) {
    const [invExist] = await db.query('SELECT id FROM ngo_inventory WHERE ngo_id = ?', [prathamId]);
    if (invExist.length === 0) {
      await db.query(
        `INSERT INTO ngo_inventory (ngo_id, category, item_name, quantity, condition_type, distributed_quantity, status)
         VALUES
         (?, 'Books', 'Class 1-5 Illustrated Reader Sets', 50, 'New', 20, 'Partially Distributed'),
         (?, 'Stationery', 'Wooden Pencils & Erasers Bulk Pack', 100, 'New', 100, 'Fully Distributed')`,
        [prathamId, prathamId]
      );
    }
  }

  // Ensure the registered NGO user (ngo@shahyogkart.com) is linked to Pratham Shiksha Foundation
  const [ngoUserRows] = await db.query("SELECT id FROM users WHERE email = 'ngo@shahyogkart.com'");
  if (ngoUserRows.length > 0 && prathamId) {
    await db.query('UPDATE ngos SET user_id = ? WHERE id = ?', [ngoUserRows[0].id, prathamId]);
    console.log(`✅ Linked user ngo@shahyogkart.com (id: ${ngoUserRows[0].id}) to Pratham Shiksha Foundation (id: ${prathamId}).`);
  }

  await db.end();
  console.log('🎉 Phase 2 Database Migration & Seeding Completed Successfully!');
}

migrateAndSeedPhase2().catch(err => {
  console.error('❌ Phase 2 Migration error:', err);
  process.exit(1);
});
