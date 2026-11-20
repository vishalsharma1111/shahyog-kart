-- =====================================================================
-- SHAHYOG KART - PHASE 3 DATABASE SCHEMA
-- Delivery Partner Management, OTP Verification, Distribution Tracking, Reward Coins
-- =====================================================================

-- 1. Delivery Partners Table
CREATE TABLE IF NOT EXISTS delivery_partners (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  vehicle_type VARCHAR(50) DEFAULT 'Motorcycle/Van',
  vehicle_number VARCHAR(50) DEFAULT 'DL-01-AB-1234',
  driving_license_number VARCHAR(100) DEFAULT 'DL-20230009871',
  current_city VARCHAR(100) DEFAULT 'Delhi',
  current_latitude DECIMAL(10, 8) DEFAULT 28.6139,
  current_longitude DECIMAL(11, 8) DEFAULT 77.2090,
  is_available BOOLEAN DEFAULT TRUE,
  total_deliveries INT DEFAULT 0,
  rating DECIMAL(3, 2) DEFAULT 4.90,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 2. Pickup Requests Table (Created when NGO accepts a donation)
CREATE TABLE IF NOT EXISTS pickup_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  request_code VARCHAR(50) UNIQUE NOT NULL,
  donation_id INT NOT NULL,
  ngo_id INT NOT NULL,
  status ENUM('Pending', 'Accepted', 'In Transit', 'Delivered', 'Cancelled') DEFAULT 'Pending',
  priority ENUM('Normal', 'High', 'Urgent') DEFAULT 'Normal',
  donor_name VARCHAR(150),
  donor_phone VARCHAR(50),
  pickup_address TEXT,
  pickup_city VARCHAR(100),
  pickup_latitude DECIMAL(10, 8),
  pickup_longitude DECIMAL(11, 8),
  ngo_name VARCHAR(150),
  ngo_address TEXT,
  ngo_city VARCHAR(100),
  ngo_latitude DECIMAL(10, 8),
  ngo_longitude DECIMAL(11, 8),
  package_category VARCHAR(100),
  package_item_name VARCHAR(255),
  package_quantity INT,
  scheduled_pickup_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (donation_id) REFERENCES donations(id) ON DELETE CASCADE,
  FOREIGN KEY (ngo_id) REFERENCES ngos(id) ON DELETE CASCADE
);

-- 3. Delivery Assignments Table (When a delivery partner accepts a pickup request)
CREATE TABLE IF NOT EXISTS delivery_assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  assignment_code VARCHAR(50) UNIQUE NOT NULL,
  pickup_request_id INT NOT NULL,
  donation_id INT NOT NULL,
  delivery_partner_id INT NOT NULL,
  status ENUM('Assigned', 'Out for Pickup', 'Collected', 'Out for Delivery', 'Arrived at NGO', 'Completed', 'Cancelled') DEFAULT 'Assigned',
  accepted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  collected_at TIMESTAMP NULL,
  delivered_at TIMESTAMP NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (pickup_request_id) REFERENCES pickup_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (donation_id) REFERENCES donations(id) ON DELETE CASCADE,
  FOREIGN KEY (delivery_partner_id) REFERENCES delivery_partners(id) ON DELETE CASCADE
);

-- 4. Delivery Tracking Updates (Real-time breadcrumb audit trail)
CREATE TABLE IF NOT EXISTS delivery_tracking (
  id INT AUTO_INCREMENT PRIMARY KEY,
  delivery_assignment_id INT NOT NULL,
  donation_id INT NOT NULL,
  status_update VARCHAR(100) NOT NULL,
  current_latitude DECIMAL(10, 8) NULL,
  current_longitude DECIMAL(11, 8) NULL,
  location_name VARCHAR(255) NULL,
  remarks TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (delivery_assignment_id) REFERENCES delivery_assignments(id) ON DELETE CASCADE,
  FOREIGN KEY (donation_id) REFERENCES donations(id) ON DELETE CASCADE
);

-- 5. Secure OTP Delivery Verification Table
CREATE TABLE IF NOT EXISTS delivery_verification (
  id INT AUTO_INCREMENT PRIMARY KEY,
  delivery_assignment_id INT NOT NULL,
  donation_id INT NOT NULL,
  ngo_id INT NOT NULL,
  otp_code VARCHAR(10) NOT NULL,
  recipient_representative_name VARCHAR(150),
  recipient_phone VARCHAR(50),
  expires_at TIMESTAMP NOT NULL,
  attempt_count INT DEFAULT 0,
  max_attempts INT DEFAULT 5,
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP NULL,
  verified_by_user_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (delivery_assignment_id) REFERENCES delivery_assignments(id) ON DELETE CASCADE,
  FOREIGN KEY (donation_id) REFERENCES donations(id) ON DELETE CASCADE,
  FOREIGN KEY (ngo_id) REFERENCES ngos(id) ON DELETE CASCADE
);

-- 6. Distribution Records Table (NGO distributing goods to beneficiaries)
CREATE TABLE IF NOT EXISTS distribution_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  distribution_code VARCHAR(50) UNIQUE NOT NULL,
  donation_id INT NOT NULL,
  ngo_id INT NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  distributed_quantity INT NOT NULL,
  distribution_date DATE NOT NULL,
  beneficiary_count INT NOT NULL DEFAULT 1,
  distribution_location VARCHAR(255) NOT NULL,
  description TEXT,
  supporting_photographs JSON,
  distribution_status ENUM('Planned', 'In Progress', 'Distributed to beneficiaries', 'Completed') DEFAULT 'Distributed to beneficiaries',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (donation_id) REFERENCES donations(id) ON DELETE CASCADE,
  FOREIGN KEY (ngo_id) REFERENCES ngos(id) ON DELETE CASCADE
);

-- 7. Configurable Reward Rules (Admin configured rates per item unit)
CREATE TABLE IF NOT EXISTS reward_rules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category VARCHAR(100) NOT NULL,
  item_name_pattern VARCHAR(255) NULL,
  coins_per_unit DECIMAL(10, 2) NOT NULL,
  min_quantity INT DEFAULT 1,
  description VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 8. Coin Transactions Ledger (Audit trail of earned, redeemed, and balance history)
CREATE TABLE IF NOT EXISTS coin_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  transaction_code VARCHAR(50) UNIQUE NOT NULL,
  user_id INT NOT NULL,
  type ENUM('earned', 'redeemed', 'refunded', 'bonus', 'expired') NOT NULL,
  coins INT NOT NULL,
  balance_after INT NOT NULL,
  reference_id INT NULL,
  reference_type ENUM('donation', 'order', 'admin_adjustment', 'bonus') NOT NULL,
  description VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
