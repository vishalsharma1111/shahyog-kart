const { query, transaction } = require('../config/db');

// Helper to ensure a user has a cart
const getOrCreateCartId = async (userId) => {
  const carts = await query('SELECT id FROM carts WHERE user_id = ?', [userId]);
  if (carts.length > 0) {
    return carts[0].id;
  }
  const result = await query('INSERT INTO carts (user_id) VALUES (?)', [userId]);
  return result.insertId;
};

// @desc Get current user's shopping cart
// @route GET /api/cart
const getCart = async (req, res) => {
  try {
    const cartId = await getOrCreateCartId(req.user.id);

    const items = await query(
      `SELECT ci.id as item_id, ci.quantity, ci.created_at as added_at,
              p.id as product_id, p.name, p.slug, p.price, p.stock, p.image_url, p.donation_percentage,
              c.name as category_name, u.organization_name as seller_organization
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       JOIN categories c ON p.category_id = c.id
       JOIN users u ON p.seller_id = u.id
       WHERE ci.cart_id = ?
       ORDER BY ci.created_at DESC`,
      [cartId]
    );

    let subtotal = 0;
    let totalDonationValue = 0;

    const formattedItems = items.map(item => {
      const itemSubtotal = parseFloat(item.price) * item.quantity;
      const donationAccrued = (itemSubtotal * (item.donation_percentage || 5)) / 100;
      subtotal += itemSubtotal;
      totalDonationValue += donationAccrued;

      return {
        ...item,
        price: parseFloat(item.price),
        itemSubtotal: parseFloat(itemSubtotal.toFixed(2)),
        donationAccrued: parseFloat(donationAccrued.toFixed(2)),
        isAvailable: item.stock >= item.quantity
      };
    });

    res.json({
      success: true,
      cart: {
        id: cartId,
        items: formattedItems,
        itemCount: formattedItems.reduce((acc, curr) => acc + curr.quantity, 0),
        subtotal: parseFloat(subtotal.toFixed(2)),
        estimatedTax: parseFloat((subtotal * 0.05).toFixed(2)), // 5% GST
        shippingFee: subtotal > 500 || subtotal === 0 ? 0 : 50, // Free shipping above 500
        total: parseFloat((subtotal + (subtotal * 0.05) + (subtotal > 500 || subtotal === 0 ? 0 : 50)).toFixed(2)),
        totalDonationValue: parseFloat(totalDonationValue.toFixed(2))
      }
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Add item to cart
// @route POST /api/cart/items
const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const targetProductId = productId || req.body.product_id;

    if (!targetProductId) {
      return res.status(400).json({ success: false, message: 'Product ID is required.' });
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid quantity.' });
    }

    // Verify product existence and stock
    const products = await query('SELECT id, name, stock, is_active FROM products WHERE id = ?', [targetProductId]);
    if (products.length === 0 || !products[0].is_active) {
      return res.status(404).json({ success: false, message: 'Product is currently not available.' });
    }

    const product = products[0];
    const cartId = await getOrCreateCartId(req.user.id);

    // Check if already in cart
    const existing = await query('SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ?', [cartId, targetProductId]);

    if (existing.length > 0) {
      const newQuantity = existing[0].quantity + qty;
      if (newQuantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Cannot add more. Only ${product.stock} items currently in stock.`
        });
      }

      await query('UPDATE cart_items SET quantity = ? WHERE id = ?', [newQuantity, existing[0].id]);
    } else {
      if (qty > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.stock} items currently in stock.`
        });
      }

      await query('INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)', [cartId, targetProductId, qty]);
    }

    res.json({
      success: true,
      message: `"${product.name}" added to cart!`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Update quantity of item in cart
// @route PUT /api/cart/items/:itemId
const updateCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 0) {
      return res.status(400).json({ success: false, message: 'Valid quantity is required.' });
    }

    const cartId = await getOrCreateCartId(req.user.id);

    const items = await query(
      `SELECT ci.id, ci.quantity, p.stock, p.name
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.id = ? AND ci.cart_id = ?`,
      [itemId, cartId]
    );

    if (items.length === 0) {
      return res.status(404).json({ success: false, message: 'Cart item not found.' });
    }

    if (qty === 0) {
      await query('DELETE FROM cart_items WHERE id = ?', [itemId]);
      return res.json({ success: true, message: 'Item removed from cart.' });
    }

    if (qty > items[0].stock) {
      return res.status(400).json({
        success: false,
        message: `Only ${items[0].stock} items available in stock for ${items[0].name}.`
      });
    }

    await query('UPDATE cart_items SET quantity = ? WHERE id = ?', [qty, itemId]);

    res.json({ success: true, message: 'Cart item updated.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Remove item from cart
// @route DELETE /api/cart/items/:itemId
const removeCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const cartId = await getOrCreateCartId(req.user.id);

    await query('DELETE FROM cart_items WHERE id = ? AND cart_id = ?', [itemId, cartId]);

    res.json({ success: true, message: 'Item removed from cart.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Clear user's entire cart
// @route DELETE /api/cart
const clearCart = async (req, res) => {
  try {
    const cartId = await getOrCreateCartId(req.user.id);
    await query('DELETE FROM cart_items WHERE cart_id = ?', [cartId]);

    res.json({ success: true, message: 'Shopping cart cleared.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart
};
