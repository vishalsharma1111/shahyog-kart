const { query, transaction } = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const coinService = require('../services/coinService');
const notificationService = require('../services/notificationService');

// Helper to calculate milestone status
const getTrackingMilestones = (orderStatus, createdAt) => {
  const steps = [
    { key: 'pending', label: 'Order Placed', desc: 'We have received your order.' },
    { key: 'confirmed', label: 'Confirmed by Seller', desc: 'Seller verified & packed your items.' },
    { key: 'shipped', label: 'Shipped', desc: 'Dispatched with our social delivery partner.' },
    { key: 'out_for_delivery', label: 'Out for Delivery', desc: 'Package is arriving at your doorstep today.' },
    { key: 'delivered', label: 'Delivered', desc: 'Package delivered safely. Thank you for making an impact!' }
  ];

  const orderRank = {
    pending: 1,
    confirmed: 2,
    shipped: 3,
    out_for_delivery: 4,
    delivered: 5,
    cancelled: 0
  };

  const currentRank = orderRank[orderStatus] || 1;

  return steps.map((step, index) => {
    const stepRank = index + 1;
    let state = 'upcoming';
    if (orderStatus === 'cancelled') {
      state = 'cancelled';
    } else if (stepRank < currentRank) {
      state = 'completed';
    } else if (stepRank === currentRank) {
      state = 'current';
    }
    return {
      ...step,
      state
    };
  });
};

// @desc Create and checkout an order from the cart
// @route POST /api/orders/checkout
const checkoutOrder = async (req, res) => {
  try {
    const { addressId, newAddress, paymentMethod = 'cod', coinsToRedeem = 0 } = req.body;
    const finalPaymentMethod = paymentMethod || req.body.payment_method || 'cod';
    const finalCoinsToRedeem = coinsToRedeem || req.body.coins_to_redeem || 0;
    const userId = req.user.id;

    // Execute atomic transaction for checkout
    const result = await transaction(async (conn) => {
      // 1. Resolve delivery address
      let targetAddressId = addressId || req.body.address_id;
      let addrObj = newAddress;
      if (!targetAddressId && !addrObj && (req.body.shipping_address || req.body.shippingAddress)) {
        const addrStr = req.body.shipping_address || req.body.shippingAddress;
        addrObj = {
          full_name: req.user.name || 'Valued Customer',
          phone: req.user.phone || '9876543210',
          street: addrStr,
          city: 'Noida',
          state: 'Uttar Pradesh',
          postal_code: '201301',
          country: 'India'
        };
      }

      if (!targetAddressId && addrObj) {
        const [addrRes] = await conn.execute(
          `INSERT INTO addresses (user_id, full_name, phone, street, city, state, postal_code, country, is_default)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            userId,
            addrObj.full_name || addrObj.fullName,
            addrObj.phone,
            addrObj.street,
            addrObj.city,
            addrObj.state,
            addrObj.postal_code || addrObj.postalCode || '110001',
            addrObj.country || 'India',
            0
          ]
        );
        targetAddressId = addrRes.insertId;
      }

      if (!targetAddressId) {
        throw new Error('Please select or provide a delivery address.');
      }

      // 2. Fetch cart items
      const [carts] = await conn.execute('SELECT id FROM carts WHERE user_id = ?', [userId]);
      if (carts.length === 0) {
        throw new Error('No shopping cart found.');
      }
      const cartId = carts[0].id;

      const [cartItems] = await conn.execute(
        `SELECT ci.product_id, ci.quantity, p.name as product_name, p.price, p.stock, p.seller_id, p.donation_percentage
         FROM cart_items ci
         JOIN products p ON ci.product_id = p.id
         WHERE ci.cart_id = ? AND p.is_active = 1`,
        [cartId]
      );

      if (cartItems.length === 0) {
        throw new Error('Your cart is empty. Add products before checkout.');
      }

      // 3. Verify stock for each item & compute totals
      let subtotal = 0;
      let totalDonation = 0;

      for (const item of cartItems) {
        if (item.stock < item.quantity) {
          throw new Error(`Insufficient stock for "${item.product_name}". Only ${item.stock} available.`);
        }
        const itemTotal = parseFloat(item.price) * item.quantity;
        subtotal += itemTotal;
        totalDonation += (itemTotal * (item.donation_percentage || 5)) / 100;
      }

      const tax = parseFloat((subtotal * 0.05).toFixed(2));
      const shippingFee = subtotal > 500 ? 0 : 50;
      const initialTotalAmount = parseFloat((subtotal + tax + shippingFee).toFixed(2));

      // 3.5. Shahyog Reward Coin Redemption (1 Coin = ₹1)
      let redeemedCoins = 0;
      let coinDiscount = 0;
      let finalTotalAmount = initialTotalAmount;

      if (finalCoinsToRedeem && parseInt(finalCoinsToRedeem, 10) > 0) {
        const redemption = await coinService.redeemCoinsForOrder(
          userId,
          parseInt(finalCoinsToRedeem, 10),
          null,
          initialTotalAmount,
          conn
        );
        redeemedCoins = redemption.coinsRedeemed;
        coinDiscount = redemption.discountAmount;
        finalTotalAmount = parseFloat((initialTotalAmount - coinDiscount).toFixed(2));
      }

      // 4. Create Order
      const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomPart = Math.floor(100000 + Math.random() * 900000);
      const orderNumber = `SK-${datePart}-${randomPart}`;

      const paymentStatus = finalPaymentMethod === 'cod' ? 'pending' : 'paid';
      const initialOrderStatus = 'confirmed'; // Auto-confirm on successful checkout

      const [orderRes] = await conn.execute(
        `INSERT INTO orders (
          order_number, user_id, address_id, subtotal, tax, shipping_fee,
          coins_redeemed, coin_discount, total_amount, donation_amount,
          status, payment_status, payment_method
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderNumber,
          userId,
          targetAddressId,
          subtotal,
          tax,
          shippingFee,
          redeemedCoins,
          coinDiscount,
          finalTotalAmount,
          totalDonation,
          initialOrderStatus,
          paymentStatus,
          paymentMethod
        ]
      );
      const orderId = orderRes.insertId;

      // Link orderId to the coin transaction if coins were redeemed
      if (redeemedCoins > 0) {
        await conn.execute(
          "UPDATE coin_transactions SET reference_id = ? WHERE reference_type = 'order' AND reference_id IS NULL AND user_id = ?",
          [orderId, userId]
        );
      }

      // 5. Create Order Items & Decrement product stock
      for (const item of cartItems) {
        const itemTotal = parseFloat(item.price) * item.quantity;
        await conn.execute(
          `INSERT INTO order_items (order_id, product_id, seller_id, product_name, price, quantity, total)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [orderId, item.product_id, item.seller_id, item.product_name, item.price, item.quantity, itemTotal]
        );

        // Decrement product stock
        await conn.execute('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.product_id]);
      }

      // 6. Record Payment
      const transactionId = `TXN-${uuidv4().substring(0, 18).toUpperCase()}`;
      await conn.execute(
        `INSERT INTO payments (order_id, user_id, amount, payment_method, payment_status, transaction_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, userId, finalTotalAmount, paymentMethod, paymentStatus === 'paid' ? 'completed' : 'pending', transactionId]
      );

      // 7. Clear Cart Items
      await conn.execute('DELETE FROM cart_items WHERE cart_id = ?', [cartId]);

      return {
        orderId,
        orderNumber,
        subtotal,
        coinDiscount,
        coinsRedeemed: redeemedCoins,
        totalAmount: finalTotalAmount,
        totalDonation,
        transactionId
      };
    });

    // Notify customer of order placement
    notificationService.notify(
      userId,
      'Order Placed Successfully! 🛍️',
      `Your order #${result.orderNumber} (₹${result.totalAmount}) has been confirmed. Thank you for supporting rural artisans!`,
      'order',
      result.orderId,
      'order'
    );

    res.status(201).json({
      success: true,
      message: 'Order placed successfully! Thank you for supporting social causes.',
      order: result
    });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Get all orders placed by the current user
// @route GET /api/orders
const getUserOrders = async (req, res) => {
  try {
    const orders = await query(
      `SELECT o.*,
              COUNT(oi.id) as total_items,
              a.full_name as recipient_name, a.city as shipping_city, a.state as shipping_state
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN addresses a ON o.address_id = a.id
       WHERE o.user_id = ?
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );

    res.json({
      success: true,
      orders
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get detailed order information by order number or id
// @route GET /api/orders/:identifier
const getOrderDetails = async (req, res) => {
  try {
    const { identifier } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Admin can view any order; customer views only their own
    let whereClause = `(o.id = ? OR o.order_number = ?)`;
    const params = [identifier, identifier];

    if (userRole === 'customer') {
      whereClause += ` AND o.user_id = ?`;
      params.push(userId);
    }

    const orders = await query(
      `SELECT o.*,
              a.full_name as shipping_name, a.phone as shipping_phone, a.street, a.city, a.state, a.postal_code, a.country,
              u.name as customer_name, u.email as customer_email,
              p.transaction_id, p.payment_method as recorded_payment_method
       FROM orders o
       LEFT JOIN addresses a ON o.address_id = a.id
       LEFT JOIN users u ON o.user_id = u.id
       LEFT JOIN payments p ON o.id = p.order_id
       WHERE ${whereClause}`,
      params
    );

    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const order = orders[0];

    // Fetch line items
    const items = await query(
      `SELECT oi.*, p.slug as product_slug, p.image_url, u.organization_name as seller_organization
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       JOIN users u ON oi.seller_id = u.id
       WHERE oi.order_id = ?`,
      [order.id]
    );

    const trackingMilestones = getTrackingMilestones(order.status, order.created_at);

    res.json({
      success: true,
      order: {
        ...order,
        items,
        trackingMilestones
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  checkoutOrder,
  getUserOrders,
  getOrderDetails
};
