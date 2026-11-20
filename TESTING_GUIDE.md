# Shahyog Kart - Quality Assurance & Testing Guide

This guide details the automated test suites, end-to-end integration flows, and manual testing procedures for validating **Shahyog Kart**.

---

## 1. Automated Test Suites Overview

Shahyog Kart comes with three automated verification suites:

| Test Suite | File Path | Focus Area | Command |
|---|---|---|---|
| **Google Auth & SSO Suite** | `backend/test_google_auth.js` | Google ID Token verification, partner registration approval enforcement, role-escalation prevention, JWT issuance. | `node backend/test_google_auth.js` |
| **Zero-Prefilled Data & Real Fundraising Suite** | `backend/test_zero_prefilled_and_fundraising.js` | Strict verification of 0-prefilled data, empty states, real payment webhooks, idempotent fund credits, and audit logging. | `node backend/test_zero_prefilled_and_fundraising.js` |
| **Phase 4 E2E Integration Suite** | `backend/test_complete_integration_phase4.js` | 17-step full lifecycle from donation through smart matching, courier dispatch, OTP verification, inventory update, coin reward, distribution, and e-commerce redemption. | `node backend/test_complete_integration_phase4.js` |
| **Full Platform Regression Suite** | `backend/test_full_platform_regression_phase3.js` | Regression coverage across Phases 1-3 (Marketplace, Cart, Order Management, Matching, OTP). | `node backend/test_full_platform_regression_phase3.js` |
| **Frontend Production Build** | `frontend/` | TypeScript/JSX compilation, Rollup tree-shaking, CSS bundling. | `npm run build --prefix frontend` |

---

## 2. Running Automated Tests

### 2.1 Running Google Authentication Tests
Tests token validation, mock token handler for test environments, auto-provisioning of users, partner registration status (`pending_verification`), and role security:

```bash
node backend/test_google_auth.js
```
Expected output:
```
🧪 Testing Google Authentication Workflow...
[Test 1] Google Customer SSO: 200 Welcome to Shahyog Kart!
[Test 2] Repeat Google SSO Login: 200 Welcome back!
[Test 3] Google NGO Partner SSO: 200 Registration submitted! Your partner account is pending admin verification.
[Test 4] Unauthorized Admin Claim Handled: 200 Assigned Role: customer
[Test 5] Verified /api/auth/me with JWT: 200 google_donor_89440@gmail.com
🎉 ALL 5 GOOGLE AUTHENTICATION TESTS PASSED WITH 100% SUCCESS!
```

### 2.2 Running Complete E2E Integration Test (17 Steps)
Simulates a live multi-persona session from registration to donation, matching, delivery, OTP, coins, and coin redemption:

```bash
node backend/test_complete_integration_phase4.js
```
Verified milestones in this test:
1. Customer registers.
2. Customer donates 20 books.
3. Smart NGO matching algorithm evaluates weighted formula:
   $$\text{Score} = (\text{Cat} \times 0.40) + (\text{Loc} \times 0.25) + (\text{Qty} \times 0.20) + (\text{Urg} \times 0.15)$$
4. Donor sends donation offer to top-ranked NGO.
5. NGO accepts offer; pickup request is automatically queued.
6. Delivery courier claims pickup request.
7. Courier marks items collected at donor's doorstep.
8. Courier arrives at NGO hub; system generates encrypted 6-digit delivery OTP.
9. NGO representative enters OTP; backend cryptographically validates OTP.
10. NGO inventory incremented and verified receipt issued.
11. Donor awarded 200 **Shahyog Coins** in real-time.
12. NGO logs distribution proof with photo URL, timestamp, and beneficiary count.
13. NGO distribution audit trail updated.
14. Donor tracks full 11-step journey via unique donation tracking code.
15. Customer redeems coins to receive an instant discount on e-commerce order.
16. Admin analytics metrics and coin ledger updated.
17. Full audit trail of notifications dispatched to user.

---

## 3. Pre-Seeded Demonstration Accounts

For manual testing across all five personas, the following accounts are pre-configured:

| Persona Role | Email Address | Password | Permissions & Dashboard |
|---|---|---|---|
| **Super Admin** | `admin@shahyogkart.com` | `Admin@123` | Full access (`/admin`): Approve partners, manage rules, monitor transactions. |
| **Verified NGO** | `ngo@shahyogkart.com` | `Ngo@123` | NGO Hub (`/ngo`): Publish requirements, accept offers, OTP receipt, log distributions. |
| **Delivery Courier** | `delivery@shahyogkart.com` | `Delivery@123` | Courier Portal (`/delivery`): Accept pickups, transit milestones, submit handover OTP. |
| **Rural Artisan Seller**| `seller@shahyogkart.com` | `Seller@123` | Seller Dashboard (`/seller`): Manage products, stock, orders, and fulfillment. |
| **Customer / Donor** | `customer@shahyogkart.com` | `Customer@123` | Public & Profile (`/profile`): Shop, donate items/money, track donations, redeem coins. |

---

## 4. Manual Testing Checklist

- [x] **Home Page:** Verify hero banners, quick donation cards, verified NGO spotlight, artisan products carousel, and testimonial section.
- [x] **Shop Page:** Search for products, filter by category/price, view product details, add to cart, proceed to checkout.
- [x] **Donate Page:** Select from 8 physical donation categories, specify condition, upload photos, fill in doorstep pickup address with coordinates, select a recommended NGO, and submit.
- [x] **NGOs Page:** Browse verified NGO directory, search by name/cause, view accepted categories, click for full profile details and active requirements.
- [x] **About & Contact Page:** Read mission and ecosystem model, interact with FAQ accordion, and submit an inquiry through the contact form.
- [x] **Google Login:** Sign in using Google OAuth on `/login` and `/register`. Verify profile picture and name auto-populate.
- [x] **Reward Coins:** Verify available balance on `/rewards` or `/profile` and apply coins for discount during checkout.
