const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.resolve(__dirname, '../config/backup_pre_production.sql'), 'utf8');
const lines = content.split('\n');
let curTable = null;
let tables = {};
for (let line of lines) {
  if (line.startsWith('CREATE TABLE `')) {
    curTable = line.match(/CREATE TABLE `([^`]+)`/)[1];
    tables[curTable] = [line];
  } else if (curTable) {
    tables[curTable].push(line);
    if (line.trim().endsWith(';')) {
      curTable = null;
    }
  }
}

// Ensure users table has google_id and avatar_url
let userDdl = tables['users'].join('\n');
if (!userDdl.includes('google_id')) {
  userDdl = userDdl.replace(/`password`[^\n]+/, match => match + '\n  `google_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,\n  `avatar_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,');
}
userDdl = userDdl.replace(/`password` varchar\(255\) COLLATE utf8mb4_unicode_ci NOT NULL/, '`password` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL');
userDdl = userDdl.replace(/`status` enum\([^\)]+\)/, "`status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'approved'");
tables['users'] = [userDdl];

// Dependency-ordered table list
const orderedTableNames = [
  'users',
  'categories',
  'products',
  'carts',
  'cart_items',
  'addresses',
  'orders',
  'order_items',
  'payments',
  'password_resets',
  'ngos',
  'ngo_requirements',
  'donations',
  'donation_images',
  'donation_matching',
  'matching_scores',
  'delivery_partners',
  'pickup_requests',
  'delivery_assignments',
  'delivery_tracking',
  'delivery_verification',
  'ngo_inventory',
  'ngo_receipts',
  'distribution_records',
  'ngo_distributions',
  'reward_rules',
  'coin_transactions',
  'notifications'
];

let out = '-- =====================================================================\n';
out += '-- SHAHYOG KART - ZERO-PREFILLED MASTER DATABASE SCHEMA (32 TABLES)\n';
out += '-- Compatible with MySQL 8.0 & TiDB Cloud Serverless\n';
out += '-- =====================================================================\n\n';
out += 'SET FOREIGN_KEY_CHECKS = 0;\n\n';

for (const name of orderedTableNames) {
  if (tables[name]) {
    let ddl = tables[name].join('\n');
    ddl = ddl.replace(/AUTO_INCREMENT=\d+\s*/g, '');
    ddl = ddl.replace(/CREATE TABLE `/g, 'CREATE TABLE IF NOT EXISTS `');
    out += ddl + '\n\n';
  }
}

out += `-- 29. fundraising_campaigns
CREATE TABLE IF NOT EXISTS \`fundraising_campaigns\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`ngo_id\` INT NOT NULL,
  \`title\` VARCHAR(255) NOT NULL,
  \`description\` TEXT NOT NULL,
  \`fundraising_goal\` DECIMAL(12, 2) NOT NULL,
  \`amount_raised\` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  \`start_date\` DATE NOT NULL,
  \`end_date\` DATE NOT NULL,
  \`status\` ENUM('pending', 'active', 'completed', 'cancelled') NOT NULL DEFAULT 'active',
  \`supporting_documents\` TEXT NULL,
  \`photographs\` TEXT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX \`idx_campaign_ngo\` (\`ngo_id\`),
  INDEX \`idx_campaign_status\` (\`status\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 30. fund_donations
CREATE TABLE IF NOT EXISTS \`fund_donations\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`transaction_id\` VARCHAR(100) NOT NULL UNIQUE,
  \`campaign_id\` INT NULL,
  \`ngo_id\` INT NOT NULL,
  \`donor_id\` INT NULL,
  \`donor_name\` VARCHAR(255) NOT NULL,
  \`donor_email\` VARCHAR(255) NOT NULL,
  \`amount\` DECIMAL(12, 2) NOT NULL,
  \`payment_gateway_ref\` VARCHAR(100) NOT NULL UNIQUE,
  \`payment_status\` ENUM('pending', 'completed', 'failed') NOT NULL DEFAULT 'pending',
  \`payment_method\` VARCHAR(50) NOT NULL DEFAULT 'online',
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`verified_at\` TIMESTAMP NULL,
  INDEX \`idx_fund_don_campaign\` (\`campaign_id\`),
  INDEX \`idx_fund_don_ngo\` (\`ngo_id\`),
  INDEX \`idx_fund_don_status\` (\`payment_status\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 31. audit_logs
CREATE TABLE IF NOT EXISTS \`audit_logs\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`user_id\` INT NULL,
  \`action\` VARCHAR(100) NOT NULL,
  \`entity_type\` VARCHAR(50) NOT NULL,
  \`entity_id\` INT NULL,
  \`previous_value\` JSON NULL,
  \`new_value\` JSON NULL,
  \`ip_address\` VARCHAR(45) NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX \`idx_audit_action\` (\`action\`),
  INDEX \`idx_audit_entity\` (\`entity_type\`, \`entity_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 32. contact_inquiries
CREATE TABLE IF NOT EXISTS \`contact_inquiries\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`name\` VARCHAR(150) NOT NULL,
  \`email\` VARCHAR(191) NOT NULL,
  \`phone\` VARCHAR(30) NULL,
  \`subject\` VARCHAR(200) NOT NULL,
  \`message\` TEXT NOT NULL,
  \`status\` ENUM('new', 'read', 'resolved') DEFAULT 'new',
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Initial essential default reward rules
INSERT IGNORE INTO \`reward_rules\` (\`id\`, \`category\`, \`item_name_pattern\`, \`coins_per_unit\`, \`min_quantity\`, \`description\`, \`is_active\`) VALUES
(1, 'Books', NULL, 10.00, 1, '10 Coins per Book (e.g. 5 Books = 50 Coins)', 1),
(2, 'Clothes', 'Jacket%', 20.00, 1, '20 Coins per Jacket (e.g. 2 Jackets = 40 Coins)', 1),
(3, 'Clothes', NULL, 5.00, 1, '5 Coins per piece of general clothing', 1),
(4, 'Stationery', 'Notebook%', 3.00, 1, '3 Coins per Notebook (e.g. 10 Notebooks = 30 Coins)', 1),
(5, 'Shoes', NULL, 10.00, 1, '10 Coins per Pair of Shoes (e.g. 5 Pairs = 50 Coins)', 1),
(6, 'Electronics', NULL, 50.00, 1, '50 Coins per functional electronic device/gadget', 1),
(7, 'Toys', NULL, 8.00, 1, '8 Coins per children toy/game', 1),
(8, 'Blankets', NULL, 25.00, 1, '25 Coins per warm winter blanket', 1);

-- Initial essential default product categories
INSERT IGNORE INTO \`categories\` (\`id\`, \`name\`, \`slug\`, \`description\`, \`image_url\`) VALUES
(1, 'Handloom & Khadi', 'handloom-khadi', 'Handcrafted authentic cotton and silk fabrics made by rural weaver collectives.', 'https://images.unsplash.com/photo-1606744888344-493238955dd5?auto=format&fit=crop&w=600&q=80'),
(2, 'Organic & Nutrition', 'organic-nutrition', 'Pure, chemical-free forest honey, cold-pressed oils, and farm-fresh spices.', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'),
(3, 'Eco Pottery & Crafts', 'eco-pottery-crafts', 'Terracotta dinnerware, organic clay cookware, and bamboo artisanal goods.', 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=600&q=80'),
(4, 'Education & Stationery', 'education-stationery', 'Recycled paper notebooks, plantable seed pens, and NGO-made canvas bags.', 'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=600&q=80'),
(5, 'Upcycled Lifestyle', 'upcycled-lifestyle', 'Recycled denim accessories, brass artifacts, and hand-embroidered utility pouches.', 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80');

-- Super Admin User (password: Admin@12345)
INSERT IGNORE INTO \`users\` (\`id\`, \`name\`, \`email\`, \`password\`, \`role\`, \`phone\`, \`status\`, \`organization_name\`, \`reward_coins\`) VALUES
(1, 'Super Admin', 'admin@shahyogkart.com', '$2b$10$ddW3j8aDYJNa64mqv/q9HehwRZPCeJziD39aPBV3AdnTosve4zDMq', 'admin', '+91 9876543210', 'approved', 'Shahyog Kart HQ', 0);

SET FOREIGN_KEY_CHECKS = 1;
`;

fs.writeFileSync(path.resolve(__dirname, '../config/schema_master_zero_prefilled.sql'), out);
console.log('Successfully generated schema_master_zero_prefilled.sql (' + out.length + ' bytes)');
