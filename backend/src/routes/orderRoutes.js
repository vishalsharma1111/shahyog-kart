const express = require('express');
const router = express.Router();
const { checkoutOrder, getUserOrders, getOrderDetails } = require('../controllers/orderController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.post('/checkout', checkoutOrder);
router.get('/', getUserOrders);
router.get('/:identifier', getOrderDetails);

module.exports = router;
