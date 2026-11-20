const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config();

const { query, pool } = require('./src/config/db');
const app = require('./src/server');

const TEST_PORT = 5007;
const API_BASE = `http://localhost:${TEST_PORT}/api`;

const req = async (endpoint, options = {}) => {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const data = await res.json();
  return { status: res.status, data };
};

async function testGoogleAuth() {
  console.log('🧪 Testing Google Authentication Workflow...\n');
  let server;
  try {
    server = app.listen(TEST_PORT);
    await new Promise(r => setTimeout(r, 600));

    // 1. New Google Customer Sign Up
    const randomId = Math.floor(Math.random() * 100000);
    const mockEmail = `google_donor_${randomId}@gmail.com`;
    const mockToken = `mock_test_token_${mockEmail}`;

    const res1 = await req('/auth/google', {
      method: 'POST',
      body: JSON.stringify({
        idToken: mockToken,
        role: 'customer'
      })
    });

    console.log('[Test 1] Google Customer SSO:', res1.status, res1.data.message);
    if (res1.status !== 200 || !res1.data.token || res1.data.user.role !== 'customer') {
      throw new Error('Google customer sign in failed: ' + JSON.stringify(res1.data));
    }
    console.log('         User ID:', res1.data.user.id, 'Status:', res1.data.user.status, 'JWT:', !!res1.data.token);

    // 2. Existing Google Customer Sign In (Repeat with same mock token)
    const res2 = await req('/auth/google', {
      method: 'POST',
      body: JSON.stringify({
        idToken: mockToken
      })
    });
    console.log('[Test 2] Repeat Google SSO Login:', res2.status, res2.data.message);
    if (res2.status !== 200 || res2.data.isNewUser !== false) {
      throw new Error('Repeat Google login failed: ' + JSON.stringify(res2.data));
    }

    // 3. New Partner Registration via Google (e.g. NGO requiring admin verification)
    const mockNgoEmail = `google_ngo_${randomId}@gmail.com`;
    const res3 = await req('/auth/google', {
      method: 'POST',
      body: JSON.stringify({
        idToken: `mock_test_token_${mockNgoEmail}`,
        role: 'ngo',
        organization_name: 'Shree Krishna Seva Trust'
      })
    });
    console.log('[Test 3] Google NGO Partner SSO:', res3.status, res3.data.message);
    if (res3.status !== 200 || res3.data.user.status !== 'pending' || res3.data.user.role !== 'ngo') {
      throw new Error('Google partner status check failed: ' + JSON.stringify(res3.data));
    }

    // 4. Role-based protection: attempt to claim admin via Google self-registration
    const mockAdminEmail = `google_hacker_${randomId}@gmail.com`;
    const res4 = await req('/auth/google', {
      method: 'POST',
      body: JSON.stringify({
        idToken: `mock_test_token_${mockAdminEmail}`,
        role: 'admin' // Attempted unauthorized privilege escalation
      })
    });
    console.log('[Test 4] Unauthorized Admin Claim Handled:', res4.status, 'Assigned Role:', res4.data.user?.role);
    if (res4.data.user?.role === 'admin') {
      throw new Error('Security vulnerability: Public self-registration allowed admin role!');
    }

    // 5. Verify /auth/me with Google-issued JWT
    const meRes = await req('/auth/me', {
      headers: { Authorization: `Bearer ${res1.data.token}` }
    });
    console.log('[Test 5] Verified /api/auth/me with JWT:', meRes.status, meRes.data.user.email);
    if (meRes.status !== 200 || meRes.data.user.email !== mockEmail) {
      throw new Error('Profile lookup failed with Google JWT: ' + JSON.stringify(meRes.data));
    }

    console.log('\n🎉 ALL 5 GOOGLE AUTHENTICATION TESTS PASSED WITH 100% SUCCESS!');
  } catch (err) {
    console.error('❌ Google Auth Test Failed:', err.message);
    process.exitCode = 1;
  } finally {
    if (server) {
      server.close();
    }
    await pool.end();
  }
}

testGoogleAuth();
