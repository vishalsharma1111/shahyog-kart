const notificationService = require('../services/notificationService');

// @desc Get user notifications & unread count
// @route GET /api/notifications
const getNotifications = async (req, res) => {
  try {
    const data = await notificationService.getUserNotifications(req.user.id);
    res.json({ success: true, ...data });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Mark a notification as read
// @route PATCH /api/notifications/:id/read
const markRead = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await notificationService.markAsRead(id, req.user.id);
    res.json({ success: true, message: 'Notification marked as read.' });
  } catch (err) {
    console.error('Error marking notification as read:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Mark all notifications as read
// @route PATCH /api/notifications/mark-all-read
const markAllRead = async (req, res) => {
  try {
    await notificationService.markAllAsRead(req.user.id);
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    console.error('Error marking all notifications as read:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getNotifications,
  markRead,
  markAllRead
};
