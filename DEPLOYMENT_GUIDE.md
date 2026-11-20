# Shahyog Kart - Production Deployment Guide

This guide walks you through deploying **Shahyog Kart** across **Vercel** (Frontend SPA), **Render** (Node.js REST API Backend), and a **Cloud MySQL Provider** (Aiven / PlanetScale / AWS RDS / Railway).

---

## 1. Cloud Architecture Overview

```
                                  +---------------------------+
                                  |   Google Identity / GSI   |
                                  +-------------+-------------+
                                                |
                   +----------------------------+----------------------------+
                   |                                                         |
                   v                                                         v
        +---------------------+                                   +--------------------+
        |   Frontend (Vercel) | ----[HTTPS / CORS / JSON APIs]--->|  Backend (Render)  |
        | https://shahyog-     |                                   | https://shahyog-   |
        | kart.vercel.app     |                                   | api.onrender.com   |
        +---------------------+                                   +---------+----------+
                   |                                                        |
                   v                                                        v
        +---------------------+                                   +--------------------+
        |  Cloudinary Storage |<----------------------------------| Cloud MySQL 8 (SSL)|
        |  (Images & Proofs)  |                                   | (Aiven/PlanetScale)|
        +---------------------+                                   +--------------------+
```

---

## 2. Step 1: Managed Cloud MySQL Setup (e.g., Aiven)

1. Sign up for a free/standard tier at [Aiven.io](https://aiven.io) or [Railway](https://railway.app).
2. Create a new **MySQL 8.0** service.
3. Once provisioned, note down your credentials:
   - `Host` (e.g., `mysql-shahyog.aivencloud.com`)
   - `Port` (e.g., `12345` or `3306`)
   - `User` (e.g., `avnadmin`)
   - `Password`
   - `Database Name`: `shahyog_kart`
   - `SSL`: `true`
4. Connect via MySQL Workbench or CLI and initialize schema by running:
   ```bash
   mysql -h <host> -P <port> -u <user> -p shahyog_kart < backend/src/config/backup_pre_production.sql
   ```
5. Run the production migration to ensure the schema has the latest modifications:
   ```bash
   node backend/src/scripts/migrate_production.js
   ```

---

## 3. Step 2: Backend Deployment on Render

1. Sign in to [Render.com](https://render.com).
2. Click **New +** $\rightarrow$ **Web Service**.
3. Connect your Git repository (e.g., `https://github.com/your-username/shahyog-kart`).
4. Configure service settings:
   - **Name:** `shahyog-kart-backend`
   - **Root Directory:** `backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/health`
5. Under **Environment Variables**, add:
   | Key | Recommended Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `PORT` | `5000` |
   | `FRONTEND_URL` | `https://shahyog-kart.vercel.app` |
   | `DATABASE_HOST` | `<your-cloud-mysql-host>` |
   | `DATABASE_PORT` | `3306` |
   | `DATABASE_USER` | `<your-cloud-mysql-user>` |
   | `DATABASE_PASSWORD` | `<your-cloud-mysql-password>` |
   | `DATABASE_NAME` | `shahyog_kart` |
   | `DB_SSL` | `true` |
   | `JWT_SECRET` | `<generate-a-strong-32-char-random-string>` |
   | `JWT_EXPIRE` | `7d` |
   | `GOOGLE_CLIENT_ID` | `<your-google-oauth-client-id>.apps.googleusercontent.com` |
   | `CLOUDINARY_CLOUD_NAME` | `<your-cloudinary-cloud-name>` |
   | `CLOUDINARY_API_KEY` | `<your-cloudinary-api-key>` |
   | `CLOUDINARY_API_SECRET` | `<your-cloudinary-api-secret>` |
6. Click **Create Web Service**. Render will automatically build and deploy the backend. Verify health by visiting `https://<your-render-subdomain>.onrender.com/health`.

---

## 4. Step 3: Frontend Deployment on Vercel

1. Sign in to [Vercel](https://vercel.com).
2. Click **Add New...** $\rightarrow$ **Project**.
3. Import your Git repository.
4. Set project configuration:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Under **Environment Variables**, add:
   | Key | Value |
   |---|---|
   | `VITE_API_URL` | `https://<your-render-subdomain>.onrender.com/api` |
   | `VITE_APP_NAME` | `Shahyog Kart` |
   | `VITE_APP_TAGLINE` | `Shop with Purpose, Donate with Love.` |
   | `VITE_GOOGLE_CLIENT_ID` | `<your-google-oauth-client-id>.apps.googleusercontent.com` |
6. Click **Deploy**. Vercel will install dependencies, build with Vite, and serve the site with the SPA rewrites configured in `frontend/vercel.json`.

---

## 5. Step 4: Google Cloud OAuth 2.0 Credentials Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com).
2. Create or select a project (e.g., `Shahyog Kart`).
3. Under **APIs & Services** $\rightarrow$ **OAuth consent screen**:
   - Select **External**.
   - Fill in App name (`Shahyog Kart`) and user support email.
   - Save and continue.
4. Under **Credentials** $\rightarrow$ **Create Credentials** $\rightarrow$ **OAuth client ID**:
   - Application type: **Web application**.
   - **Authorized JavaScript origins**:
     - `http://localhost:5173` (for local development)
     - `https://shahyog-kart.vercel.app` (your production Vercel domain)
     - `https://*.vercel.app`
   - **Authorized redirect URIs**:
     - `http://localhost:5173`
     - `https://shahyog-kart.vercel.app`
5. Copy the generated **Client ID** and set it in both frontend (`VITE_GOOGLE_CLIENT_ID`) and backend (`GOOGLE_CLIENT_ID`).

---

## 6. Step 5: Post-Deployment Smoke Verification

1. Open your Vercel deployment URL (`https://shahyog-kart.vercel.app`).
2. Verify all 5 main pages load cleanly:
   - **Home:** Hero section, impact statistics, featured artisan products, donation categories.
   - **Shop:** Product catalogue, category filters, product details, cart.
   - **Donate:** 8 donation categories, pickup coordinates, donation form.
   - **NGOs:** Verified NGO directory, search, requirement badges, NGO details modal.
   - **About & Contact:** Ecosystem pillars, impact metrics, working contact form submitting to backend.
3. Test Google Sign-In on the Login and Register pages.
4. Verify dashboards for each persona (`/profile`, `/ngo`, `/delivery`, `/seller`, `/admin`).
