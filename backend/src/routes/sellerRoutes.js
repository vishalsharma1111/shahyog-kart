const express = require('express');
const router = express.Router();
const {
  getSellerStats,
  getSellerProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  updateInventoryStock,
  getSellerOrders,
  updateOrderStatus
} = require('../controllers/sellerController');
const { authenticate, authorize, requireVerified } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Base authentication & role check
router.use(authenticate, authorize('seller', 'admin'));

// Route to get seller overview (accessible even if pending so they can view dashboard state)
router.get('/stats', getSellerStats);
router.get('/products', getSellerProducts);

// Mutation operations strictly require verified status
router.post('/products', requireVerified, upload.single('image'), addProduct);
router.put('/products/:id', requireVerified, upload.single('image'), updateProduct);
router.delete('/products/:id', requireVerified, deleteProduct);
router.patch('/products/:id/stock', requireVerified, updateInventoryStock);

router.get('/orders', getSellerOrders);
router.patch('/orders/:id/status', requireVerified, updateOrderStatus);

module.exports = router;
