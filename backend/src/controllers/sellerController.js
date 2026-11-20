const { query } = require('../config/db');

// Helper to slugify string
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-') + '-' + Date.now().toString().slice(-4);
};

// @desc Get seller dashboard statistics
// @route GET /api/seller/stats
const getSellerStats = async (req, res) => {
  try {
    const sellerId = req.user.id;

    // Total products & stock
    const [prodStats] = await query(
      `SELECT COUNT(*) as totalProducts,
              COALESCE(SUM(stock), 0) as totalStock,
              SUM(CASE WHEN stock <= 5 THEN 1 ELSE 0 END) as lowStockCount
       FROM products
       WHERE seller_id = ? AND is_active = 1`,
      [sellerId]
    );

    // Total orders & revenue from order items
    const [orderStats] = await query(
      `SELECT COUNT(DISTINCT oi.order_id) as totalOrders,
              COALESCE(SUM(oi.total), 0) as totalRevenue,
              COALESCE(SUM(oi.quantity), 0) as totalUnitsSold
       FROM order_items oi
       WHERE oi.seller_id = ?`,
      [sellerId]
    );

    // Recent orders
    const recentOrders = await query(
      `SELECT oi.id as item_id, oi.order_id, oi.product_name, oi.price, oi.quantity, oi.total,
              o.order_number, o.status as order_status, o.payment_status, o.created_at,
              u.name as customer_name
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       JOIN users u ON o.user_id = u.id
       WHERE oi.seller_id = ?
       ORDER BY o.created_at DESC
       LIMIT 5`,
      [sellerId]
    );

    res.json({
      success: true,
      stats: {
        totalProducts: prodStats.totalProducts || 0,
        totalStock: prodStats.totalStock || 0,
        lowStockCount: prodStats.lowStockCount || 0,
        totalOrders: orderStats.totalOrders || 0,
        totalRevenue: parseFloat(orderStats.totalRevenue || 0),
        totalUnitsSold: orderStats.totalUnitsSold || 0,
        recentOrders
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get all products belonging to current seller
// @route GET /api/seller/products
const getSellerProducts = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { search = '', category = 'all' } = req.query;

    let sql = `
      SELECT p.*, c.name as category_name
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.seller_id = ?
    `;
    const params = [sellerId];

    if (search && search.trim() !== '') {
      sql += ` AND (p.name LIKE ? OR p.description LIKE ?)`;
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    if (category && category !== 'all') {
      sql += ` AND p.category_id = ?`;
      params.push(parseInt(category, 10));
    }

    sql += ` ORDER BY p.created_at DESC`;

    const products = await query(sql, params);

    res.json({
      success: true,
      products
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Add a new product
// @route POST /api/seller/products
const addProduct = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { name, category_id, description, price, stock, donation_percentage, image_url } = req.body;

    if (!name || !category_id || !price) {
      return res.status(400).json({ success: false, message: 'Please provide product name, category, and price.' });
    }

    // Determine final image URL (uploaded file or provided URL)
    let finalImageUrl = image_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80';
    if (req.file) {
      finalImageUrl = `/uploads/${req.file.filename}`;
    }

    const slug = slugify(name);

    const result = await query(
      `INSERT INTO products (seller_id, category_id, name, slug, description, price, stock, donation_percentage, image_url, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        sellerId,
        parseInt(category_id, 10),
        name.trim(),
        slug,
        description || '',
        parseFloat(price),
        parseInt(stock || 0, 10),
        parseInt(donation_percentage || 5, 10),
        finalImageUrl
      ]
    );

    const newProduct = await query('SELECT p.*, c.name as category_name FROM products p JOIN categories c ON p.category_id = c.id WHERE p.id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Product published successfully!',
      product: newProduct[0]
    });
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Update existing product
// @route PUT /api/seller/products/:id
const updateProduct = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { id } = req.params;
    const { name, category_id, description, price, stock, donation_percentage, image_url, is_active } = req.body;

    // Check ownership
    const existing = await query('SELECT id, image_url FROM products WHERE id = ? AND seller_id = ?', [id, sellerId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found or not authorized.' });
    }

    let finalImageUrl = image_url || existing[0].image_url;
    if (req.file) {
      finalImageUrl = `/uploads/${req.file.filename}`;
    }

    await query(
      `UPDATE products
       SET name = COALESCE(?, name),
           category_id = COALESCE(?, category_id),
           description = COALESCE(?, description),
           price = COALESCE(?, price),
           stock = COALESCE(?, stock),
           donation_percentage = COALESCE(?, donation_percentage),
           image_url = ?,
           is_active = COALESCE(?, is_active)
       WHERE id = ? AND seller_id = ?`,
      [
        name ? name.trim() : null,
        category_id ? parseInt(category_id, 10) : null,
        description !== undefined ? description : null,
        price ? parseFloat(price) : null,
        stock !== undefined ? parseInt(stock, 10) : null,
        donation_percentage !== undefined ? parseInt(donation_percentage, 10) : null,
        finalImageUrl,
        is_active !== undefined ? (is_active ? 1 : 0) : null,
        id,
        sellerId
      ]
    );

    const updated = await query('SELECT p.*, c.name as category_name FROM products p JOIN categories c ON p.category_id = c.id WHERE p.id = ?', [id]);

    res.json({
      success: true,
      message: 'Product updated successfully!',
      product: updated[0]
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Delete product
// @route DELETE /api/seller/products/:id
const deleteProduct = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { id } = req.params;

    const existing = await query('SELECT id FROM products WHERE id = ? AND seller_id = ?', [id, sellerId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found or unauthorized.' });
    }

    await query('DELETE FROM products WHERE id = ? AND seller_id = ?', [id, sellerId]);

    res.json({
      success: true,
      message: 'Product deleted successfully.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Manage inventory stock quickly
// @route PATCH /api/seller/products/:id/stock
const updateInventoryStock = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { id } = req.params;
    const { stock } = req.body;

    const stockNum = parseInt(stock, 10);
    if (isNaN(stockNum) || stockNum < 0) {
      return res.status(400).json({ success: false, message: 'Invalid stock number.' });
    }

    await query('UPDATE products SET stock = ? WHERE id = ? AND seller_id = ?', [stockNum, id, sellerId]);

    res.json({
      success: true,
      message: 'Stock updated successfully!',
      stock: stockNum
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get orders for items belonging to seller
// @route GET /api/seller/orders
const getSellerOrders = async (req, res) => {
  try {
    const sellerId = req.user.id;

    const orders = await query(
      `SELECT o.id, o.order_number, o.status as order_status, o.payment_status, o.created_at,
              a.full_name as customer_name, a.city as customer_city, a.phone as customer_phone,
              oi.id as order_item_id, oi.product_name, oi.price, oi.quantity, oi.total as item_total,
              p.image_url as product_image
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       JOIN products p ON oi.product_id = p.id
       LEFT JOIN addresses a ON o.address_id = a.id
       WHERE oi.seller_id = ?
       ORDER BY o.created_at DESC`,
      [sellerId]
    );

    res.json({
      success: true,
      orders
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Update order fulfillment status
// @route PATCH /api/seller/orders/:id/status
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid order status specified.' });
    }

    await query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);

    res.json({
      success: true,
      message: `Order status updated to '${status}'.`,
      status
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getSellerStats,
  getSellerProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  updateInventoryStock,
  getSellerOrders,
  updateOrderStatus
};
