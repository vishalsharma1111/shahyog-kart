-- =====================================================================
-- SHAHYOG KART - ZERO-PREFILLED MASTER DATABASE SCHEMA (32 TABLES)
-- Compatible with MySQL 8.0 & TiDB Cloud Serverless
-- =====================================================================

SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `google_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `avatar_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` enum('customer','ngo','delivery','seller','admin') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'customer',
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'approved' COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'approved',
  `organization_name` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `reward_coins` int DEFAULT '0',
  `total_coins_earned` int DEFAULT '0',
  `total_coins_redeemed` int DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_user_email` (`email`),
  KEY `idx_user_role` (`role`),
  KEY `idx_user_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `seller_id` int NOT NULL,
  `category_id` int NOT NULL,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(250) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `price` decimal(10,2) NOT NULL,
  `stock` int NOT NULL DEFAULT '0',
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `donation_percentage` int DEFAULT '5',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_product_seller` (`seller_id`),
  KEY `idx_product_category` (`category_id`),
  KEY `idx_product_active` (`is_active`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`seller_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `products_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `carts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `carts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cart_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cart_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_cart_product` (`cart_id`,`product_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `cart_items_ibfk_1` FOREIGN KEY (`cart_id`) REFERENCES `carts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `cart_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `addresses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `full_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `street` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `city` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `state` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `postal_code` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `country` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'India',
  `is_default` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_address_user` (`user_id`),
  CONSTRAINT `addresses_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_number` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` int NOT NULL,
  `address_id` int DEFAULT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `tax` decimal(10,2) NOT NULL DEFAULT '0.00',
  `shipping_fee` decimal(10,2) NOT NULL DEFAULT '0.00',
  `total_amount` decimal(10,2) NOT NULL,
  `donation_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `status` enum('pending','confirmed','shipped','out_for_delivery','delivered','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `payment_status` enum('pending','paid','failed','refunded') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `payment_method` enum('card','upi','cod') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'cod',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `coins_redeemed` int DEFAULT '0',
  `coin_discount` decimal(10,2) DEFAULT '0.00',
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_number` (`order_number`),
  KEY `address_id` (`address_id`),
  KEY `idx_order_user` (`user_id`),
  KEY `idx_order_number` (`order_number`),
  KEY `idx_order_status` (`status`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`address_id`) REFERENCES `addresses` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `order_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `product_id` int NOT NULL,
  `seller_id` int NOT NULL,
  `product_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `quantity` int NOT NULL,
  `total` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  KEY `idx_order_item_order` (`order_id`),
  KEY `idx_order_item_seller` (`seller_id`),
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `order_items_ibfk_3` FOREIGN KEY (`seller_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `user_id` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_method` enum('card','upi','cod') COLLATE utf8mb4_unicode_ci NOT NULL,
  `payment_status` enum('pending','completed','failed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'completed',
  `transaction_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `transaction_id` (`transaction_id`),
  KEY `user_id` (`user_id`),
  KEY `idx_payment_order` (`order_id`),
  KEY `idx_payment_tx` (`transaction_id`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `payments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `password_resets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` datetime NOT NULL,
  `used` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `idx_reset_token` (`token`),
  CONSTRAINT `password_resets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ngos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `organization_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `registration_number` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cause_area` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `target_amount` decimal(12,2) DEFAULT '100000.00',
  `raised_amount` decimal(12,2) DEFAULT '0.00',
  `verified_by_admin` tinyint(1) DEFAULT '1',
  `website` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `contact_person` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT '28.61390000',
  `longitude` decimal(11,8) DEFAULT '77.20900000',
  `city` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'New Delhi',
  `state` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'Delhi',
  `accepted_categories` json DEFAULT NULL,
  `supporting_documents` json DEFAULT NULL,
  `capacity_limit` int DEFAULT '1000',
  `current_load` int DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `registration_number` (`registration_number`),
  KEY `user_id` (`user_id`),
  KEY `idx_ngo_cause` (`cause_area`),
  CONSTRAINT `ngos_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ngo_requirements` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ngo_id` int NOT NULL,
  `item_category` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `item_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `required_quantity` int NOT NULL DEFAULT '1',
  `received_quantity` int NOT NULL DEFAULT '0',
  `remaining_quantity` int GENERATED ALWAYS AS (greatest(0,(`required_quantity` - `received_quantity`))) STORED,
  `priority` enum('Urgent','High','Medium','Low') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Medium',
  `description` text COLLATE utf8mb4_unicode_ci,
  `required_date` date DEFAULT NULL,
  `status` enum('Active','Fulfilled','Closed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_req_ngo` (`ngo_id`),
  KEY `idx_req_category` (`item_category`),
  KEY `idx_req_status` (`status`),
  CONSTRAINT `ngo_requirements_ibfk_1` FOREIGN KEY (`ngo_id`) REFERENCES `ngos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `donations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `donor_id` int DEFAULT NULL,
  `ngo_id` int DEFAULT NULL,
  `donor_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `donor_email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cause_title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `payment_method` enum('card','upi','netbanking') COLLATE utf8mb4_unicode_ci DEFAULT 'upi',
  `payment_status` enum('completed','pending','failed') COLLATE utf8mb4_unicode_ci DEFAULT 'completed',
  `message` text COLLATE utf8mb4_unicode_ci,
  `transaction_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `donation_code` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `donation_type` enum('monetary','item') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'monetary',
  `item_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `category` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `quantity` int DEFAULT '1',
  `condition_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'Good',
  `description` text COLLATE utf8mb4_unicode_ci,
  `pickup_address` text COLLATE utf8mb4_unicode_ci,
  `pickup_city` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pickup_state` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pickup_pincode` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'Submitted',
  `matched_ngo_id` int DEFAULT NULL,
  `rejection_reason` text COLLATE utf8mb4_unicode_ci,
  `distributed_count` int DEFAULT '0',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `delivery_partner_id` int DEFAULT NULL,
  `pickup_request_id` int DEFAULT NULL,
  `coins_awarded` int DEFAULT '0',
  `distributed_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `transaction_id` (`transaction_id`),
  KEY `ngo_id` (`ngo_id`),
  KEY `idx_donation_donor` (`donor_id`),
  KEY `idx_donation_tx` (`transaction_id`),
  CONSTRAINT `donations_ibfk_1` FOREIGN KEY (`donor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `donations_ibfk_2` FOREIGN KEY (`ngo_id`) REFERENCES `ngos` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `donation_images` (
  `id` int NOT NULL AUTO_INCREMENT,
  `donation_id` int NOT NULL,
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `donation_id` (`donation_id`),
  CONSTRAINT `donation_images_ibfk_1` FOREIGN KEY (`donation_id`) REFERENCES `donations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `donation_matching` (
  `id` int NOT NULL AUTO_INCREMENT,
  `donation_id` int NOT NULL,
  `ngo_id` int NOT NULL,
  `requirement_id` int DEFAULT NULL,
  `matching_score` decimal(5,2) NOT NULL DEFAULT '0.00',
  `category_score` decimal(5,2) NOT NULL DEFAULT '0.00',
  `location_score` decimal(5,2) NOT NULL DEFAULT '0.00',
  `quantity_score` decimal(5,2) NOT NULL DEFAULT '0.00',
  `urgency_score` decimal(5,2) NOT NULL DEFAULT '0.00',
  `status` enum('Offered','Accepted','Rejected','Expired') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Offered',
  `rejection_reason` text COLLATE utf8mb4_unicode_ci,
  `offered_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `responded_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `requirement_id` (`requirement_id`),
  KEY `idx_match_don` (`donation_id`),
  KEY `idx_match_ngo` (`ngo_id`),
  CONSTRAINT `donation_matching_ibfk_1` FOREIGN KEY (`donation_id`) REFERENCES `donations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `donation_matching_ibfk_2` FOREIGN KEY (`ngo_id`) REFERENCES `ngos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `donation_matching_ibfk_3` FOREIGN KEY (`requirement_id`) REFERENCES `ngo_requirements` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `matching_scores` (
  `id` int NOT NULL AUTO_INCREMENT,
  `matching_id` int DEFAULT NULL,
  `donation_id` int NOT NULL,
  `ngo_id` int NOT NULL,
  `final_score` decimal(5,2) NOT NULL,
  `category_weight_score` decimal(5,2) NOT NULL,
  `location_weight_score` decimal(5,2) NOT NULL,
  `quantity_weight_score` decimal(5,2) NOT NULL,
  `urgency_weight_score` decimal(5,2) NOT NULL,
  `distance_km` decimal(8,2) NOT NULL,
  `match_reasons` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_scores_don` (`donation_id`),
  KEY `idx_scores_ngo` (`ngo_id`),
  CONSTRAINT `matching_scores_ibfk_1` FOREIGN KEY (`donation_id`) REFERENCES `donations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `matching_scores_ibfk_2` FOREIGN KEY (`ngo_id`) REFERENCES `ngos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `delivery_partners` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `vehicle_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'Motorcycle/Van',
  `vehicle_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'DL-01-AB-1234',
  `driving_license_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'DL-20230009871',
  `current_city` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'Delhi',
  `current_latitude` decimal(10,8) DEFAULT '28.61390000',
  `current_longitude` decimal(11,8) DEFAULT '77.20900000',
  `is_available` tinyint(1) DEFAULT '1',
  `total_deliveries` int DEFAULT '0',
  `rating` decimal(3,2) DEFAULT '4.90',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `delivery_partners_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `pickup_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `request_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `donation_id` int NOT NULL,
  `ngo_id` int NOT NULL,
  `status` enum('Pending','Accepted','In Transit','Delivered','Cancelled') COLLATE utf8mb4_unicode_ci DEFAULT 'Pending',
  `priority` enum('Normal','High','Urgent') COLLATE utf8mb4_unicode_ci DEFAULT 'Normal',
  `donor_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `donor_phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pickup_address` text COLLATE utf8mb4_unicode_ci,
  `pickup_city` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pickup_latitude` decimal(10,8) DEFAULT NULL,
  `pickup_longitude` decimal(11,8) DEFAULT NULL,
  `ngo_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ngo_address` text COLLATE utf8mb4_unicode_ci,
  `ngo_city` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ngo_latitude` decimal(10,8) DEFAULT NULL,
  `ngo_longitude` decimal(11,8) DEFAULT NULL,
  `package_category` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `package_item_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `package_quantity` int DEFAULT NULL,
  `scheduled_pickup_date` date DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `request_code` (`request_code`),
  KEY `donation_id` (`donation_id`),
  KEY `ngo_id` (`ngo_id`),
  CONSTRAINT `pickup_requests_ibfk_1` FOREIGN KEY (`donation_id`) REFERENCES `donations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `pickup_requests_ibfk_2` FOREIGN KEY (`ngo_id`) REFERENCES `ngos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `delivery_assignments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `assignment_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `pickup_request_id` int NOT NULL,
  `donation_id` int NOT NULL,
  `delivery_partner_id` int NOT NULL,
  `status` enum('Assigned','Out for Pickup','Collected','Out for Delivery','Arrived at NGO','Completed','Cancelled') COLLATE utf8mb4_unicode_ci DEFAULT 'Assigned',
  `accepted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `collected_at` timestamp NULL DEFAULT NULL,
  `delivered_at` timestamp NULL DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `assignment_code` (`assignment_code`),
  KEY `pickup_request_id` (`pickup_request_id`),
  KEY `donation_id` (`donation_id`),
  KEY `delivery_partner_id` (`delivery_partner_id`),
  CONSTRAINT `delivery_assignments_ibfk_1` FOREIGN KEY (`pickup_request_id`) REFERENCES `pickup_requests` (`id`) ON DELETE CASCADE,
  CONSTRAINT `delivery_assignments_ibfk_2` FOREIGN KEY (`donation_id`) REFERENCES `donations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `delivery_assignments_ibfk_3` FOREIGN KEY (`delivery_partner_id`) REFERENCES `delivery_partners` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `delivery_tracking` (
  `id` int NOT NULL AUTO_INCREMENT,
  `delivery_assignment_id` int NOT NULL,
  `donation_id` int NOT NULL,
  `status_update` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `current_latitude` decimal(10,8) DEFAULT NULL,
  `current_longitude` decimal(11,8) DEFAULT NULL,
  `location_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `remarks` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `delivery_assignment_id` (`delivery_assignment_id`),
  KEY `donation_id` (`donation_id`),
  CONSTRAINT `delivery_tracking_ibfk_1` FOREIGN KEY (`delivery_assignment_id`) REFERENCES `delivery_assignments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `delivery_tracking_ibfk_2` FOREIGN KEY (`donation_id`) REFERENCES `donations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `delivery_verification` (
  `id` int NOT NULL AUTO_INCREMENT,
  `delivery_assignment_id` int NOT NULL,
  `donation_id` int NOT NULL,
  `ngo_id` int NOT NULL,
  `otp_code` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `recipient_representative_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `recipient_phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `expires_at` timestamp NOT NULL,
  `attempt_count` int DEFAULT '0',
  `max_attempts` int DEFAULT '5',
  `is_verified` tinyint(1) DEFAULT '0',
  `verified_at` timestamp NULL DEFAULT NULL,
  `verified_by_user_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `delivery_assignment_id` (`delivery_assignment_id`),
  KEY `donation_id` (`donation_id`),
  KEY `ngo_id` (`ngo_id`),
  CONSTRAINT `delivery_verification_ibfk_1` FOREIGN KEY (`delivery_assignment_id`) REFERENCES `delivery_assignments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `delivery_verification_ibfk_2` FOREIGN KEY (`donation_id`) REFERENCES `donations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `delivery_verification_ibfk_3` FOREIGN KEY (`ngo_id`) REFERENCES `ngos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ngo_inventory` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ngo_id` int NOT NULL,
  `donation_id` int DEFAULT NULL,
  `category` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `item_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `condition_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'Good',
  `received_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `distributed_quantity` int NOT NULL DEFAULT '0',
  `available_quantity` int GENERATED ALWAYS AS (greatest(0,(`quantity` - `distributed_quantity`))) STORED,
  `status` enum('In Stock','Partially Distributed','Fully Distributed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'In Stock',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `donation_id` (`donation_id`),
  KEY `idx_inv_ngo` (`ngo_id`),
  KEY `idx_inv_cat` (`category`),
  CONSTRAINT `ngo_inventory_ibfk_1` FOREIGN KEY (`ngo_id`) REFERENCES `ngos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ngo_inventory_ibfk_2` FOREIGN KEY (`donation_id`) REFERENCES `donations` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ngo_receipts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ngo_id` int NOT NULL,
  `donation_id` int NOT NULL,
  `donor_id` int DEFAULT NULL,
  `donor_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `receipt_number` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `item_summary` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity_received` int NOT NULL,
  `condition_verified` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'Good',
  `received_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `notes` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `receipt_number` (`receipt_number`),
  KEY `donation_id` (`donation_id`),
  KEY `donor_id` (`donor_id`),
  KEY `idx_rcpt_ngo` (`ngo_id`),
  KEY `idx_rcpt_num` (`receipt_number`),
  CONSTRAINT `ngo_receipts_ibfk_1` FOREIGN KEY (`ngo_id`) REFERENCES `ngos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ngo_receipts_ibfk_2` FOREIGN KEY (`donation_id`) REFERENCES `donations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ngo_receipts_ibfk_3` FOREIGN KEY (`donor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `distribution_records` (
  `id` int NOT NULL AUTO_INCREMENT,
  `distribution_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `donation_id` int NOT NULL,
  `ngo_id` int NOT NULL,
  `item_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `distributed_quantity` int NOT NULL,
  `distribution_date` date NOT NULL,
  `beneficiary_count` int NOT NULL DEFAULT '1',
  `distribution_location` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `supporting_photographs` json DEFAULT NULL,
  `distribution_status` enum('Planned','In Progress','Distributed to beneficiaries','Completed') COLLATE utf8mb4_unicode_ci DEFAULT 'Distributed to beneficiaries',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `distribution_code` (`distribution_code`),
  KEY `donation_id` (`donation_id`),
  KEY `ngo_id` (`ngo_id`),
  CONSTRAINT `distribution_records_ibfk_1` FOREIGN KEY (`donation_id`) REFERENCES `donations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `distribution_records_ibfk_2` FOREIGN KEY (`ngo_id`) REFERENCES `ngos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ngo_distributions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ngo_id` int NOT NULL,
  `inventory_id` int DEFAULT NULL,
  `beneficiary_group` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `location` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity_distributed` int NOT NULL,
  `distributed_date` date NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `inventory_id` (`inventory_id`),
  KEY `idx_dist_ngo` (`ngo_id`),
  CONSTRAINT `ngo_distributions_ibfk_1` FOREIGN KEY (`ngo_id`) REFERENCES `ngos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ngo_distributions_ibfk_2` FOREIGN KEY (`inventory_id`) REFERENCES `ngo_inventory` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `reward_rules` (
  `id` int NOT NULL AUTO_INCREMENT,
  `category` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `item_name_pattern` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `coins_per_unit` decimal(10,2) NOT NULL,
  `min_quantity` int DEFAULT '1',
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `coin_transactions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `transaction_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` int NOT NULL,
  `type` enum('earned','redeemed','refunded','bonus','expired') COLLATE utf8mb4_unicode_ci NOT NULL,
  `coins` int NOT NULL,
  `balance_after` int NOT NULL,
  `reference_id` int DEFAULT NULL,
  `reference_type` enum('donation','order','admin_adjustment','bonus') COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `transaction_code` (`transaction_code`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `coin_transactions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('donation','delivery','reward','order','system') COLLATE utf8mb4_unicode_ci DEFAULT 'system',
  `reference_id` int DEFAULT NULL,
  `reference_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 29. fundraising_campaigns
CREATE TABLE IF NOT EXISTS `fundraising_campaigns` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `ngo_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `fundraising_goal` DECIMAL(12, 2) NOT NULL,
  `amount_raised` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `status` ENUM('pending', 'active', 'completed', 'cancelled') NOT NULL DEFAULT 'active',
  `supporting_documents` TEXT NULL,
  `photographs` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_campaign_ngo` (`ngo_id`),
  INDEX `idx_campaign_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 30. fund_donations
CREATE TABLE IF NOT EXISTS `fund_donations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `transaction_id` VARCHAR(100) NOT NULL UNIQUE,
  `campaign_id` INT NULL,
  `ngo_id` INT NOT NULL,
  `donor_id` INT NULL,
  `donor_name` VARCHAR(255) NOT NULL,
  `donor_email` VARCHAR(255) NOT NULL,
  `amount` DECIMAL(12, 2) NOT NULL,
  `payment_gateway_ref` VARCHAR(100) NOT NULL UNIQUE,
  `payment_status` ENUM('pending', 'completed', 'failed') NOT NULL DEFAULT 'pending',
  `payment_method` VARCHAR(50) NOT NULL DEFAULT 'online',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `verified_at` TIMESTAMP NULL,
  INDEX `idx_fund_don_campaign` (`campaign_id`),
  INDEX `idx_fund_don_ngo` (`ngo_id`),
  INDEX `idx_fund_don_status` (`payment_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 31. audit_logs
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NULL,
  `action` VARCHAR(100) NOT NULL,
  `entity_type` VARCHAR(50) NOT NULL,
  `entity_id` INT NULL,
  `previous_value` JSON NULL,
  `new_value` JSON NULL,
  `ip_address` VARCHAR(45) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_audit_action` (`action`),
  INDEX `idx_audit_entity` (`entity_type`, `entity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 32. contact_inquiries
CREATE TABLE IF NOT EXISTS `contact_inquiries` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `phone` VARCHAR(30) NULL,
  `subject` VARCHAR(200) NOT NULL,
  `message` TEXT NOT NULL,
  `status` ENUM('new', 'read', 'resolved') DEFAULT 'new',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Initial essential default reward rules
INSERT IGNORE INTO `reward_rules` (`id`, `category`, `item_name_pattern`, `coins_per_unit`, `min_quantity`, `description`, `is_active`) VALUES
(1, 'Books', NULL, 10.00, 1, '10 Coins per Book (e.g. 5 Books = 50 Coins)', 1),
(2, 'Clothes', 'Jacket%', 20.00, 1, '20 Coins per Jacket (e.g. 2 Jackets = 40 Coins)', 1),
(3, 'Clothes', NULL, 5.00, 1, '5 Coins per piece of general clothing', 1),
(4, 'Stationery', 'Notebook%', 3.00, 1, '3 Coins per Notebook (e.g. 10 Notebooks = 30 Coins)', 1),
(5, 'Shoes', NULL, 10.00, 1, '10 Coins per Pair of Shoes (e.g. 5 Pairs = 50 Coins)', 1),
(6, 'Electronics', NULL, 50.00, 1, '50 Coins per functional electronic device/gadget', 1),
(7, 'Toys', NULL, 8.00, 1, '8 Coins per children toy/game', 1),
(8, 'Blankets', NULL, 25.00, 1, '25 Coins per warm winter blanket', 1);

-- Initial essential default product categories
INSERT IGNORE INTO `categories` (`id`, `name`, `slug`, `description`, `image_url`) VALUES
(1, 'Handloom & Khadi', 'handloom-khadi', 'Handcrafted authentic cotton and silk fabrics made by rural weaver collectives.', 'https://images.unsplash.com/photo-1606744888344-493238955dd5?auto=format&fit=crop&w=600&q=80'),
(2, 'Organic & Nutrition', 'organic-nutrition', 'Pure, chemical-free forest honey, cold-pressed oils, and farm-fresh spices.', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'),
(3, 'Eco Pottery & Crafts', 'eco-pottery-crafts', 'Terracotta dinnerware, organic clay cookware, and bamboo artisanal goods.', 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=600&q=80'),
(4, 'Education & Stationery', 'education-stationery', 'Recycled paper notebooks, plantable seed pens, and NGO-made canvas bags.', 'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=600&q=80'),
(5, 'Upcycled Lifestyle', 'upcycled-lifestyle', 'Recycled denim accessories, brass artifacts, and hand-embroidered utility pouches.', 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80');

-- Super Admin User (password: Admin@12345)
INSERT IGNORE INTO `users` (`id`, `name`, `email`, `password`, `role`, `phone`, `status`, `organization_name`, `reward_coins`) VALUES
(1, 'Super Admin', 'admin@shahyogkart.com', '$2b$10$ddW3j8aDYJNa64mqv/q9HehwRZPCeJziD39aPBV3AdnTosve4zDMq', 'admin', '+91 9876543210', 'approved', 'Shahyog Kart HQ', 0);

SET FOREIGN_KEY_CHECKS = 1;
