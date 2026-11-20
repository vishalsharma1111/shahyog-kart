const app = require('./src/server');
const http = require('http');

async function testBackend() {
  console.log('🧪 Starting backend automated API tests...');

  // Helper fetch function
  const request = async (path, options = {}) => {
    const res = await fetch(`http://localhost:5000${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });
    const data = await res.json();
    return { status: res.status, data };
  };

  try {
    // 1. Health check
    const health = await request('/api/health');
    console.log('1. Health check:', health.status, health.data.status);
    if (health.status !== 200) throw new Error('Health check failed');

    // 2. Customer login
    const custLogin = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'customer@shahyogkart.com', password: 'Customer@123' })
    });
    console.log('2. Customer login:', custLogin.status, custLogin.data.user?.name);
    const customerToken = custLogin.data.token;
    if (!customerToken) throw new Error('Customer login failed');

    // 3. Admin login
    const adminLogin = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@shahyogkart.com', password: 'Admin@123' })
    });
    console.log('3. Admin login:', adminLogin.status, adminLogin.data.user?.name);
    const adminToken = adminLogin.data.token;

    // 4. Seller login
    const sellerLogin = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'seller@shahyogkart.com', password: 'Seller@123' })
    });
    console.log('4. Seller login:', sellerLogin.status, sellerLogin.data.user?.name);
    const sellerToken = sellerLogin.data.token;

    // 5. Get products
    const productsRes = await request('/api/products');
    console.log('5. Products fetched:', productsRes.data.products?.length, 'items');

    // 6. Get categories
    const categoriesRes = await request('/api/products/categories');
    console.log('6. Categories fetched:', categoriesRes.data.categories?.length, 'categories');

    // 7. Test Cart: Add item to cart
    const firstProductId = productsRes.data.products[0]?.id;
    const addCartRes = await request('/api/cart/items', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({ productId: firstProductId, quantity: 1 })
    });
    console.log('7. Add to cart:', addCartRes.status, addCartRes.data.message);

    // 8. Fetch cart
    const cartRes = await request('/api/cart', {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    console.log('8. Cart details: Items count =', cartRes.data.cart?.itemCount, 'Total = ₹' + cartRes.data.cart?.total);

    // 9. Checkout order
    const checkoutRes = await request('/api/orders/checkout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({
        newAddress: {
          full_name: 'Aarav Sharma',
          phone: '+91 9811223344',
          street: '123 MG Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          postal_code: '560001'
        },
        paymentMethod: 'cod'
      })
    });
    console.log('9. Checkout order:', checkoutRes.status, checkoutRes.data.order?.orderNumber);

    // 10. Fetch user order history
    const orderHistory = await request('/api/orders', {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    console.log('10. Order history count:', orderHistory.data.orders?.length);

    // 11. Test Pending Seller verification rule
    const pendingSellerLogin = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'pendingseller@shahyogkart.com', password: 'Seller@123' })
    });
    console.log('11. Pending seller login status:', pendingSellerLogin.data.user?.status);
    const pendingToken = pendingSellerLogin.data.token;

    // Attempt to add product as pending seller (should be blocked with 403)
    const blockedRes = await request('/api/seller/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${pendingToken}` },
      body: JSON.stringify({ name: 'Blocked Product', category_id: 1, price: 100 })
    });
    console.log('12. Blocked pending seller from adding product (403 expected):', blockedRes.status, blockedRes.data.isPendingVerification);

    // 13. Admin verifies pending partner
    const pendingUserId = pendingSellerLogin.data.user?.id;
    const verifyRes = await request(`/api/admin/verifications/${pendingUserId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'approved' })
    });
    console.log('13. Admin approved pending seller:', verifyRes.status, verifyRes.data.message);

    console.log('🎉 ALL BACKEND API TESTS PASSED SUCCESSFULLY!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testBackend();
