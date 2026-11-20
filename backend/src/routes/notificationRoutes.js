const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markRead,
  markAllRead
} = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', getNotifications);
router.patch('/:id/read', markRead);
router.patch('/mark-all-read', markAllRead);

module.exports = router;
