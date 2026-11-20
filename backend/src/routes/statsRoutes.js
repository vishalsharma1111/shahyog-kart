const express = require('express');
const router = express.Router();
const { getPublicImpactStats } = require('../controllers/statsController');

router.get('/public', getPublicImpactStats);

module.exports = router;
