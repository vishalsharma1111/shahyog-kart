# Shahyog Kart - REST API Documentation

This document provides a comprehensive reference for the backend REST APIs powering **Shahyog Kart** (`Shop with Purpose, Donate with Love`).

- **Base URL (Local):** `http://localhost:5000/api`
- **Base URL (Production Render):** `https://your-backend.onrender.com/api`
- **Authentication:** Bearer token via `Authorization: Bearer <JWT>` header or Google ID Token exchange.

---

## 1. Authentication & Identity (`/api/auth`)

### 1.1 Google OAuth 2.0 Single Sign-On
- **Route:** `POST /api/auth/google`
- **Access:** Public
- **Description:** Verifies Google ID tokens using `google-auth-library` and issues platform JWTs. Supports automatic account provisioning, partner approval flows, and role enforcement.
- **Request Body:**
```json
{
  "idToken": "<google_id_token_string>",
  "role": "customer", // 'customer', 'seller', 'ngo', 'delivery'
  "extraData": {
    "phone": "+91 9876543210",
    "organization_name": "Child Welfare Foundation",
    "registration_number": "REG-DEL-2024-889"
  }
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Welcome to Shahyog Kart!",
  "token": "eyJhbGciOiJIUzI1NiIsIn...",
  "user": {
    "id": 12,
    "name": "Aarav Sharma",
    "email": "aarav@gmail.com",
    "role": "customer",
    "status": "approved",
    "avatar_url": "https://lh3.googleusercontent.com/..."
  },
  "isNewUser": false
}
```

### 1.2 Traditional Email/Password Registration
- **Route:** `POST /api/auth/register`
- **Access:** Public
- **Request Body:**
```json
{
  "name": "Priya Patel",
  "email": "priya@example.com",
  "password": "Password@123",
  "phone": "+91 9876543210",
  "role": "customer",
  "organization_name": ""
}
```

### 1.3 Traditional Email/Password Login
- **Route:** `POST /api/auth/login`
- **Access:** Public
- **Request Body:**
```json
{
  "email": "customer@shahyogkart.com",
  "password": "Customer@123"
}
```

### 1.4 Get Current Profile
- **Route:** `GET /api/auth/me`
- **Access:** Protected (Any valid JWT)
- **Response (200 OK):** Current user object with active status and role.

### 1.5 Update Profile
- **Route:** `PUT /api/auth/me`
- **Access:** Protected (Any valid JWT)
- **Request Body:** `{ "name": "...", "phone": "..." }`

---

## 2. E-Commerce Marketplace (`/api/products`, `/api/cart`, `/api/orders`)

### 2.1 Get Products
- **Route:** `GET /api/products`
- **Query Params:** `category`, `search`, `minPrice`, `maxPrice`, `sort`
- **Response:** List of products with inventory, seller names, and images.

### 2.2 Get Product Details
- **Route:** `GET /api/products/:identifier`
- **Access:** Public (slug or ID)

### 2.3 Manage Cart
- `GET /api/cart`: Retrieve user's cart items.
- `POST /api/cart/items`: Add or update item (`productId`, `quantity`).
- `DELETE /api/cart/items/:id`: Remove item from cart.

### 2.4 Checkout with Shahyog Coins
- **Route:** `POST /api/orders/checkout`
- **Access:** Protected (`customer`, `admin`)
- **Request Body:**
```json
{
  "addressId": 1,
  "coinsToRedeem": 50,
  "paymentMethod": "cod" // or 'card', 'upi'
}
```
- **Response (201 Created):**
```json
{
  "success": true,
  "message": "Order placed successfully!",
  "order": {
    "id": 14,
    "order_number": "SK-ORD-20261119-4821",
    "subtotal": 899.00,
    "coin_discount": 50.00,
    "total_amount": 849.00,
    "coins_redeemed": 50,
    "status": "pending"
  }
}
```

---

## 3. Physical Item Donations & Smart Matching (`/api/donations/items`)

### 3.1 Submit Item Donation
- **Route:** `POST /api/donations/items`
- **Access:** Protected (`customer`, `admin`)
- **Request Body:**
```json
{
  "item_name": "Secondary School Textbooks",
  "category": "Books",
  "quantity": 20,
  "condition_state": "Good",
  "description": "NCERT Class 10 Science & Math textbooks in clean condition.",
  "pickup_street": "Sector 62, Noida",
  "pickup_city": "Noida",
  "pickup_state": "Uttar Pradesh",
  "pickup_postal_code": "201301",
  "latitude": 28.6280,
  "longitude": 77.3649,
  "images": ["https://res.cloudinary.com/.../books.jpg"]
}
```
- **Response (201 Created):** Unique donation code (`SK-DON-YYYYMMDD-XXXXXX`), initial status `Submitted`.

### 3.2 Smart NGO Recommendations
- **Route:** `GET /api/donations/items/:id/recommendations`
- **Access:** Protected
- **Algorithm:**
$$\text{Score} = (\text{Category} \times 0.40) + (\text{Location} \times 0.25) + (\text{Quantity} \times 0.20) + (\text{Urgency} \times 0.15)$$
- **Response:** Ranked array of verified NGOs with compatibility score percentages and breakdown factors.

### 3.3 Dispatch Donation Offer
- **Route:** `POST /api/donations/items/:id/offer`
- **Access:** Protected
- **Request Body:** `{ "ngoId": 1 }`
- **Status Transition:** `Submitted` $\rightarrow$ `NGO Matched`

### 3.4 Public Tracking
- **Route:** `GET /api/donations/items/track/:identifier`
- **Access:** Public (by ID or donation code)
- **Response:** Complete 11-stage audit trail with timestamps and delivery/distribution details.

---

## 4. NGO Hub APIs (`/api/ngo`)

### 4.1 NGO Requirements
- `GET /api/ngo/requirements`: List active public NGO requirements.
- `POST /api/ngo/requirements`: Create requirement (`category`, `item_name`, `required_quantity`, `priority`, `urgency_date`).
- `PUT /api/ngo/requirements/:id`: Update requirement.

### 4.2 Respond to Donation Offer
- **Route:** `POST /api/ngo/offers/:matchId/respond`
- **Request Body:** `{ "action": "accept" }` or `{ "action": "reject" }`
- **Outcome:** If accepted, creates an active logistics pickup request in status `Pending`.

### 4.3 NGO Inventory & Receipts
- `GET /api/ngo/receipts`: Verified receipt ledger.
- `GET /api/ngo/inventory`: Current items in stock.

### 4.4 Record Beneficiary Distribution
- **Route:** `POST /api/ngo/distributions`
- **Request Body:**
```json
{
  "donationId": 25,
  "itemName": "Secondary School Textbooks",
  "distributedQuantity": 20,
  "beneficiaryCount": 10,
  "distributionDate": "2026-11-19",
  "distributionLocation": "Slum Learning Center, Noida",
  "description": "Handed over to 10 underprivileged high school students.",
  "photos": ["https://res.cloudinary.com/.../distribution.jpg"]
}
```

---

## 5. Logistics Fleet APIs (`/api/delivery`)

### 5.1 Available Pickups
- `GET /api/delivery/pickups`: List pending pickups.
- `POST /api/delivery/pickups/:id/accept`: Claim pickup request.

### 5.2 Milestone Updates
- `PATCH /api/delivery/active/:tripId/status`: Update status (`Picked Up`, `In Transit`, `Arrived at NGO`).
- When status reaches `Arrived at NGO`, system automatically generates an encrypted 6-digit OTP sent to the verified NGO representative.

### 5.3 OTP Handover Verification
- **Route:** `POST /api/delivery/active/:tripId/verify-otp`
- **Request Body:** `{ "otp": "322371" }`
- **Result:**
  1. Validates OTP and verifies against 60-minute expiry window and 3-attempt lock.
  2. Updates donation status to `Received by NGO`.
  3. Increments NGO inventory and writes a verified receipt.
  4. Automatically awards configurable **Shahyog Reward Coins** to donor.
  5. Sends multi-stakeholder notifications.

---

## 6. Shahyog Reward Coin Engine (`/api/coins`)

- `GET /api/coins/my-wallet`: User's available coins, earned coins, redeemed coins, and rupee discount equivalence.
- `GET /api/coins/history`: Complete ledger of credit/debit coin transactions.
- `GET /api/admin/coins/rules`: Configured coin reward multipliers per item category.
- `POST /api/admin/coins/rules`: Admin updates coin credit policies.

---

## 7. Contact & Inquiries (`/api/contact`)

- **Route:** `POST /api/contact`
- **Access:** Public
- **Request Body:**
```json
{
  "name": "Sunita Verma",
  "email": "sunita@example.com",
  "phone": "+91 9811122233",
  "subject": "Volunteer & NGO Onboarding Inquiry",
  "message": "We would like to register our child healthcare foundation on Shahyog Kart."
}
```
- **Response (201 Created):** `{ "success": true, "inquiryId": 2 }`
- `GET /api/contact`: Admin view of submitted contact inquiries.

---

## 8. Verified NGO Fundraising & Fund Management (`/api/fundraising`)

### 8.1 Public Active Campaigns
- **Route:** `GET /api/fundraising/campaigns`
- **Access:** Public
- **Description:** Returns active campaigns with verified `amount_raised` computed strictly from completed payments ($Remaining = Goal - Verified$).

### 8.2 Campaign Details & Verified Donors Ledger
- **Route:** `GET /api/fundraising/campaigns/:id`
- **Access:** Public

### 8.3 NGO Campaign Management
- `GET /api/fundraising/my-campaigns`: Protected (`role='ngo'`). List campaigns with live verified totals.
- `POST /api/fundraising/my-campaigns`: Protected (`role='ngo'`). Create a new campaign with goal, dates, description, and photographs.

### 8.4 Initiate Fund Donation Order
- **Route:** `POST /api/fundraising/donate`
- **Access:** Public or Authenticated
- **Request Body:**
```json
{
  "campaign_id": 1,
  "ngo_id": 2,
  "amount": 5000,
  "donor_name": "Rohan Sharma",
  "donor_email": "rohan@example.com"
}
```
- **Response (201 Created):** Unique `transaction_id` and gateway reference with initial status `pending`.

### 8.5 Verify Payment & Credit Campaign Total (Idempotent Webhook)
- **Route:** `POST /api/fundraising/verify-payment`
- **Access:** Webhook / Secured Verification
- **Request Body:**
```json
{
  "transaction_id": "TXN-FUND-1795112647867-6B418791",
  "payment_gateway_ref": "GATEWAY-A1B2C3D4",
  "status": "completed" // or "failed"
}
```
- **Description:** Atomically marks payment completed, increments campaign verified amount raised via SQL transaction, logs audit entry, and prevents duplicate credits.

---

## 9. Real-Time Database Metrics & Public Stats (`/api/stats/public`)

- **Route:** `GET /api/stats/public`
- **Access:** Public
- **Description:** Real-time database aggregation query returning true platform totals ($0$ when empty):
```json
{
  "success": true,
  "stats": {
    "totalVerifiedNgos": 0,
    "totalDonations": 0,
    "totalOrders": 0,
    "totalProducts": 0,
    "totalBeneficiaries": 0,
    "totalFundsRaised": 0.00,
    "totalCoinsIssued": 0,
    "totalSellers": 0,
    "totalUsers": 1
  }
}
```

