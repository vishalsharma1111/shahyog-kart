const { query } = require('../config/db');

// @desc Get all products with filters, search, and sorting
// @route GET /api/products
const getProducts = async (req, res) => {
  try {
    const {
      search = '',
      category = '',
      minPrice,
      maxPrice,
      inStock,
      sort = 'newest',
      page = 1,
      limit = 24
    } = req.query;

    let sql = `
      SELECT p.*, c.name as category_name, c.slug as category_slug, u.organization_name as seller_organization, u.name as seller_name
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN users u ON p.seller_id = u.id
      WHERE p.is_active = 1
    `;
    const params = [];

    // Search by title or description
    if (search && search.trim() !== '') {
      sql += ` AND (p.name LIKE ? OR p.description LIKE ?)`;
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    // Category filter by slug or ID
    if (category && category !== 'all') {
      if (!isNaN(category)) {
        sql += ` AND p.category_id = ?`;
        params.push(parseInt(category, 10));
      } else {
        sql += ` AND c.slug = ?`;
        params.push(category);
      }
    }

    // Price range
    if (minPrice && !isNaN(minPrice)) {
      sql += ` AND p.price >= ?`;
      params.push(parseFloat(minPrice));
    }
    if (maxPrice && !isNaN(maxPrice)) {
      sql += ` AND p.price <= ?`;
      params.push(parseFloat(maxPrice));
    }

    // Stock availability
    if (inStock === 'true' || inStock === true) {
      sql += ` AND p.stock > 0`;
    }

    // Sorting
    switch (sort) {
      case 'price-asc':
        sql += ` ORDER BY p.price ASC`;
        break;
      case 'price-desc':
        sql += ` ORDER BY p.price DESC`;
        break;
      case 'popular':
        sql += ` ORDER BY p.stock ASC, p.id DESC`;
        break;
      case 'newest':
      default:
        sql += ` ORDER BY p.created_at DESC`;
        break;
    }

    // Pagination
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 24;
    const offset = (pageNum - 1) * limitNum;

    // Total count query
    const countSql = `SELECT COUNT(*) as total FROM (${sql}) as tempTable`;
    const totalResult = await query(countSql, params);
    const total = totalResult[0]?.total || 0;

    sql += ` LIMIT ? OFFSET ?`;
    params.push(limitNum, offset);

    const products = await query(sql, params);

    res.json({
      success: true,
      products,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get single product details by id or slug
// @route GET /api/products/:identifier
const getProductByIdOrSlug = async (req, res) => {
  try {
    const { identifier } = req.params;

    let sql = `
      SELECT p.*, c.name as category_name, c.slug as category_slug, u.organization_name as seller_organization, u.name as seller_name, u.email as seller_email
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN users u ON p.seller_id = u.id
      WHERE (p.id = ? OR p.slug = ?)
      LIMIT 1
    `;

    const products = await query(sql, [identifier, identifier]);
    if (products.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const product = products[0];

    // Fetch related products from same category
    const related = await query(
      `SELECT p.id, p.name, p.slug, p.price, p.stock, p.image_url, p.donation_percentage, c.name as category_name
       FROM products p
       JOIN categories c ON p.category_id = c.id
       WHERE p.category_id = ? AND p.id != ? AND p.is_active = 1
       LIMIT 4`,
      [product.category_id, product.id]
    );

    res.json({
      success: true,
      product,
      related
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get all categories with product count
// @route GET /api/categories
const getCategories = async (req, res) => {
  try {
    const categories = await query(`
      SELECT c.*, COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.is_active = 1
      GROUP BY c.id
      ORDER BY c.name ASC
    `);

    res.json({
      success: true,
      categories
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getProducts,
  getProductByIdOrSlug,
  getCategories
};
