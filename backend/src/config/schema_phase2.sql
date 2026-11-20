-- ============================================================
-- SHAHYOG KART - PHASE 2 DATABASE EXTENSIONS
-- ============================================================
USE `shahyog_kart`;

-- 1. Enhance NGOs table with Phase 2 fields if not present
ALTER TABLE `ngos`
  ADD COLUMN IF NOT EXISTS `contact_person` VARCHAR(150) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `phone` VARCHAR(30) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `latitude` DECIMAL(10, 8) DEFAULT 28.61390000,
  ADD COLUMN IF NOT EXISTS `longitude` DECIMAL(11, 8) DEFAULT 77.20900000,
  ADD COLUMN IF NOT EXISTS `city` VARCHAR(100) DEFAULT 'New Delhi',
  ADD COLUMN IF NOT EXISTS `state` VARCHAR(100) DEFAULT 'Delhi',
  ADD COLUMN IF NOT EXISTS `accepted_categories` JSON DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `supporting_documents` JSON DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `capacity_limit` INT DEFAULT 1000,
  ADD COLUMN IF NOT EXISTS `current_load` INT DEFAULT 0;

-- 2. Enhance Donations table for Physical Item Donations while preserving Phase 1 monetary donations
ALTER TABLE `donations`
  MODIFY COLUMN `amount` DECIMAL(10, 2) NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `donation_code` VARCHAR(64) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `donation_type` ENUM('monetary', 'item') NOT NULL DEFAULT 'monetary',
  ADD COLUMN IF NOT EXISTS `item_name` VARCHAR(255) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `category` VARCHAR(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `quantity` INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS `condition_type` VARCHAR(50) DEFAULT 'Good',
  ADD COLUMN IF NOT EXISTS `description` TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `pickup_address` TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `pickup_city` VARCHAR(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `pickup_state` VARCHAR(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `pickup_pincode` VARCHAR(20) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `latitude` DECIMAL(10, 8) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `longitude` DECIMAL(11, 8) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `status` ENUM(
    'Submitted',
    'Under Review',
    'Approved',
    'NGO Matched',
    'NGO Accepted',
    'Pickup Assigned',
    'Collected',
    'Received by NGO',
    'Distributed',
    'Completed',
    'Rejected'
  ) NOT NULL DEFAULT 'Submitted',
  ADD COLUMN IF NOT EXISTS `matched_ngo_id` INT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `rejection_reason` TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `distributed_count` INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- 3. Donation Images Table
CREATE TABLE IF NOT EXISTS `donation_images` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `donation_id` INT NOT NULL,
  `image_url` VARCHAR(500) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`donation_id`) REFERENCES `donations`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. NGO Requirements Table
CREATE TABLE IF NOT EXISTS `ngo_requirements` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `ngo_id` INT NOT NULL,
  `item_category` VARCHAR(100) NOT NULL,
  `item_name` VARCHAR(200) NOT NULL,
  `required_quantity` INT NOT NULL DEFAULT 1,
  `received_quantity` INT NOT NULL DEFAULT 0,
  `remaining_quantity` INT GENERATED ALWAYS AS (GREATEST(0, required_quantity - received_quantity)) STORED,
  `priority` ENUM('Urgent', 'High', 'Medium', 'Low') NOT NULL DEFAULT 'Medium',
  `description` TEXT DEFAULT NULL,
  `required_date` DATE DEFAULT NULL,
  `status` ENUM('Active', 'Fulfilled', 'Closed') NOT NULL DEFAULT 'Active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`ngo_id`) REFERENCES `ngos`(`id`) ON DELETE CASCADE,
  INDEX `idx_req_ngo` (`ngo_id`),
  INDEX `idx_req_category` (`item_category`),
  INDEX `idx_req_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. NGO Inventory Table
CREATE TABLE IF NOT EXISTS `ngo_inventory` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `ngo_id` INT NOT NULL,
  `donation_id` INT DEFAULT NULL,
  `category` VARCHAR(100) NOT NULL,
  `item_name` VARCHAR(200) NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `condition_type` VARCHAR(50) DEFAULT 'Good',
  `received_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `distributed_quantity` INT NOT NULL DEFAULT 0,
  `available_quantity` INT GENERATED ALWAYS AS (GREATEST(0, quantity - distributed_quantity)) STORED,
  `status` ENUM('In Stock', 'Partially Distributed', 'Fully Distributed') NOT NULL DEFAULT 'In Stock',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`ngo_id`) REFERENCES `ngos`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`donation_id`) REFERENCES `donations`(`id`) ON DELETE SET NULL,
  INDEX `idx_inv_ngo` (`ngo_id`),
  INDEX `idx_inv_cat` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Donation Matching Table
CREATE TABLE IF NOT EXISTS `donation_matching` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `donation_id` INT NOT NULL,
  `ngo_id` INT NOT NULL,
  `requirement_id` INT DEFAULT NULL,
  `matching_score` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
  `category_score` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
  `location_score` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
  `quantity_score` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
  `urgency_score` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
  `status` ENUM('Offered', 'Accepted', 'Rejected', 'Expired') NOT NULL DEFAULT 'Offered',
  `rejection_reason` TEXT DEFAULT NULL,
  `offered_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `responded_at` TIMESTAMP NULL DEFAULT NULL,
  FOREIGN KEY (`donation_id`) REFERENCES `donations`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`ngo_id`) REFERENCES `ngos`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`requirement_id`) REFERENCES `ngo_requirements`(`id`) ON DELETE SET NULL,
  INDEX `idx_match_don` (`donation_id`),
  INDEX `idx_match_ngo` (`ngo_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Matching Scores Detail Table (for transparency and audit)
CREATE TABLE IF NOT EXISTS `matching_scores` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `matching_id` INT DEFAULT NULL,
  `donation_id` INT NOT NULL,
  `ngo_id` INT NOT NULL,
  `final_score` DECIMAL(5, 2) NOT NULL,
  `category_weight_score` DECIMAL(5, 2) NOT NULL,
  `location_weight_score` DECIMAL(5, 2) NOT NULL,
  `quantity_weight_score` DECIMAL(5, 2) NOT NULL,
  `urgency_weight_score` DECIMAL(5, 2) NOT NULL,
  `distance_km` DECIMAL(8, 2) NOT NULL,
  `match_reasons` JSON DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`donation_id`) REFERENCES `donations`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`ngo_id`) REFERENCES `ngos`(`id`) ON DELETE CASCADE,
  INDEX `idx_scores_don` (`donation_id`),
  INDEX `idx_scores_ngo` (`ngo_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. NGO Receipts Table
CREATE TABLE IF NOT EXISTS `ngo_receipts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `ngo_id` INT NOT NULL,
  `donation_id` INT NOT NULL,
  `donor_id` INT DEFAULT NULL,
  `donor_name` VARCHAR(150) NOT NULL,
  `receipt_number` VARCHAR(64) NOT NULL UNIQUE,
  `item_summary` VARCHAR(255) NOT NULL,
  `quantity_received` INT NOT NULL,
  `condition_verified` VARCHAR(50) DEFAULT 'Good',
  `received_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `notes` TEXT DEFAULT NULL,
  FOREIGN KEY (`ngo_id`) REFERENCES `ngos`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`donation_id`) REFERENCES `donations`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`donor_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_rcpt_ngo` (`ngo_id`),
  INDEX `idx_rcpt_num` (`receipt_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. NGO Distributions Table (for Distribution Management)
CREATE TABLE IF NOT EXISTS `ngo_distributions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `ngo_id` INT NOT NULL,
  `inventory_id` INT DEFAULT NULL,
  `beneficiary_group` VARCHAR(200) NOT NULL,
  `location` VARCHAR(200) NOT NULL,
  `quantity_distributed` INT NOT NULL,
  `distributed_date` DATE NOT NULL,
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`ngo_id`) REFERENCES `ngos`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`inventory_id`) REFERENCES `ngo_inventory`(`id`) ON DELETE SET NULL,
  INDEX `idx_dist_ngo` (`ngo_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
