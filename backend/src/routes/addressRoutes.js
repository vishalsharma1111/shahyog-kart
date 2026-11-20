const express = require('express');
const router = express.Router();
const { getAddresses, addAddress, deleteAddress, setDefaultAddress } = require('../controllers/addressController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', getAddresses);
router.post('/', addAddress);
router.delete('/:id', deleteAddress);
router.patch('/:id/default', setDefaultAddress);

module.exports = router;
