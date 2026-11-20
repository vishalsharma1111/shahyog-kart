# Shahyog Kart - Database Setup & Schema Guide

This guide describes how to configure, migrate, seed, and back up the MySQL relational database powering **Shahyog Kart**.

---

## 1. Prerequisites
- **MySQL 8.0+** running locally or via a cloud managed provider (e.g., Aiven, PlanetScale, Railway, AWS RDS, GCP Cloud SQL).
- Node.js 18+ installed to run automated migration and backup scripts.

---

## 2. Environment Variables Configuration

Set these variables in `backend/.env` (or in your cloud hosting provider's dashboard):

```env
# Standard configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=YOUR_MYSQL_PASSWORD
DB_NAME=shahyog_kart
DB_SSL=false

# Cloud managed MySQL (Aiven, Render, Railway, AWS RDS)
DATABASE_HOST=mysql-shahyog-instance.aivencloud.com
DATABASE_PORT=3306
DATABASE_USER=avnadmin
DATABASE_PASSWORD=your_secure_password
DATABASE_NAME=shahyog_kart
DB_SSL=true
```

> **Note:** The database pool in `backend/src/config/db.js` automatically detects whether to use `DATABASE_*` or `DB_*` variables and applies SSL (`rejectUnauthorized: false`) whenever `DB_SSL=true`.

---

## 3. Database Initial Setup & Migration

### Step 3.1: Create the Database
```sql
CREATE DATABASE IF NOT EXISTS shahyog_kart 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;
```

### Step 3.2: Run Automated Migration
Shahyog Kart includes an automated migration script that checks and applies table alterations (including Google OAuth IDs, avatar URLs, contact inquiries, and indexes):

```bash
node backend/src/scripts/migrate_production.js
```

### Step 3.3: Seed Test & Demonstration Data
To populate the database with default categories, sample artisan products, verified NGOs, delivery partners, and seed users:

```bash
node backend/src/scripts/seed_demo_data.js
```

---

## 4. Database Schema Overview

```
users
 ├── ngos (1:1 with users where role='ngo')
 │    ├── ngo_requirements (1:N)
 │    ├── ngo_receipts (1:N)
 │    ├── ngo_inventory (1:N)
 │    └── ngo_distributions (1:N)
 ├── products (1:N with users where role='seller')
 ├── cart & cart_items (1:N)
 ├── orders & order_items (1:N)
 ├── item_donations (1:N with donor users)
 │    ├── donation_matches (1:N with ngos)
 │    ├── pickup_requests (1:1 with delivery courier users)
 │    ├── donation_tracking_milestones (1:N timeline events)
 │    └── donation_deliveries (1:1 with OTP verification)
 ├── coin_wallet & coin_transactions (1:N with users)
 ├── addresses (1:N with users)
 ├── notifications (1:N with users)
 └── contact_inquiries (Standalone CRM table)
```

### Key Tables & Field Specifications:

1. **`users`**:
   - `id`: INT AUTO_INCREMENT PRIMARY KEY
   - `name`: VARCHAR(255) NOT NULL
   - `email`: VARCHAR(255) NOT NULL UNIQUE
   - `password`: VARCHAR(255) NULL (nullable to support Google OAuth SSO)
   - `google_id`: VARCHAR(100) NULL UNIQUE (Google OAuth subject ID)
   - `avatar_url`: VARCHAR(500) NULL
   - `role`: ENUM('customer', 'seller', 'ngo', 'delivery', 'admin') DEFAULT 'customer'
   - `status`: VARCHAR(50) DEFAULT 'approved' ('approved', 'pending_verification', 'suspended')
   - `organization_name`: VARCHAR(255) NULL
   - `phone`: VARCHAR(50) NULL
   - `created_at`, `updated_at`: TIMESTAMP

2. **`item_donations`**:
   - `id`: INT AUTO_INCREMENT PRIMARY KEY
   - `donation_code`: VARCHAR(50) NOT NULL UNIQUE (`SK-DON-YYYYMMDD-XXXXXX`)
   - `donor_id`: INT NOT NULL REFERENCES `users(id)`
   - `item_name`: VARCHAR(255) NOT NULL
   - `category`: VARCHAR(100) NOT NULL (Books, Clothes, Shoes, Food, Stationery, Toys, Blankets, Household essentials)
   - `quantity`: INT NOT NULL
   - `condition_state`: VARCHAR(50) NOT NULL
   - `status`: VARCHAR(50) DEFAULT 'Submitted'
   - `latitude`, `longitude`: DECIMAL(10, 8) NULL (doorstep pickup coordinates)
   - `images`: JSON or TEXT

3. **`donation_matches`**:
   - Stores smart matching recommendations and scores (`final_score`, `category_score`, `location_score`, `quantity_score`, `urgency_score`, `status`).

4. **`pickup_requests` & `donation_deliveries`**:
   - Tracks courier assignments, OTP handovers (`delivery_otp`, `otp_expires_at`, `otp_attempts`, `is_verified`), and GPS check-ins.

5. **`coin_wallet` & `coin_transactions`**:
   - Atomic reward ledger: `available_coins`, `total_earned`, `total_redeemed`.

6. **`contact_inquiries`**:
   - `id`: INT AUTO_INCREMENT PRIMARY KEY
   - `name`: VARCHAR(255) NOT NULL
   - `email`: VARCHAR(255) NOT NULL
   - `phone`: VARCHAR(50) NULL
   - `subject`: VARCHAR(255) NOT NULL
   - `message`: TEXT NOT NULL
   - `status`: VARCHAR(50) DEFAULT 'new'

7. **`fundraising_campaigns`**:
   - `id`: INT AUTO_INCREMENT PRIMARY KEY
   - `ngo_id`: INT NOT NULL REFERENCES `ngos(id)`
   - `title`: VARCHAR(255) NOT NULL
   - `description`: TEXT NOT NULL
   - `fundraising_goal`: DECIMAL(12, 2) NOT NULL
   - `amount_raised`: DECIMAL(12, 2) NOT NULL DEFAULT 0.00 (verified payments only)
   - `start_date`, `end_date`: DATE NOT NULL
   - `status`: ENUM('pending', 'active', 'completed', 'cancelled') DEFAULT 'active'

8. **`fund_donations`**:
   - `id`: INT AUTO_INCREMENT PRIMARY KEY
   - `transaction_id`: VARCHAR(100) NOT NULL UNIQUE
   - `campaign_id`: INT NULL REFERENCES `fundraising_campaigns(id)`
   - `ngo_id`: INT NOT NULL REFERENCES `ngos(id)`
   - `donor_id`: INT NULL REFERENCES `users(id)`
   - `donor_name`, `donor_email`: VARCHAR(255) NOT NULL
   - `amount`: DECIMAL(12, 2) NOT NULL
   - `payment_gateway_ref`: VARCHAR(100) NOT NULL UNIQUE
   - `payment_status`: ENUM('pending', 'completed', 'failed') DEFAULT 'pending'
   - `verified_at`: TIMESTAMP NULL

9. **`audit_logs`**:
   - `id`: INT AUTO_INCREMENT PRIMARY KEY
   - `user_id`: INT NULL REFERENCES `users(id)`
   - `action`: VARCHAR(100) NOT NULL
   - `entity_type`: VARCHAR(50) NOT NULL
   - `entity_id`: INT NULL
   - `previous_value`, `new_value`: JSON NULL
   - `ip_address`: VARCHAR(45) NULL
   - `created_at`: TIMESTAMP DEFAULT CURRENT_TIMESTAMP

---

## 5. Automated Backup & Recovery

### Automated Backup Script
Run the automated Node.js backup script to produce a timestamped SQL dump:

```bash
node backend/src/scripts/backup_db.js
```
Backups are saved to `backend/src/config/backup_pre_production.sql`.

### Restoring from Backup
```bash
mysql -u <username> -p -h <host> shahyog_kart < backend/src/config/backup_pre_production.sql
```
