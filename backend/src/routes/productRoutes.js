const express = require('express');
const router = express.Router();
const { getProducts, getProductByIdOrSlug, getCategories } = require('../controllers/productController');

router.get('/categories', getCategories);
router.get('/', getProducts);
router.get('/:identifier', getProductByIdOrSlug);

module.exports = router;
