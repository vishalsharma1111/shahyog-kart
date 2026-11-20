const { query } = require('../config/db');

class NotificationService {
  /**
   * Create a single notification for a specific user
   */
  async notify(userId, title, message, type = 'system', referenceId = null, referenceType = null) {
    if (!userId) return null;
    try {
      const res = await query(
        `INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type, is_read)
         VALUES (?, ?, ?, ?, ?, ?, 0)`,
        [userId, title, message, type, referenceId, referenceType]
      );
      return res.insertId;
    } catch (err) {
      console.error('Failed to create notification:', err);
      return null;
    }
  }

  /**
   * Broadcast a notification to all admins
   */
  async notifyAdmins(title, message, type = 'system', referenceId = null, referenceType = null) {
    try {
      const admins = await query("SELECT id FROM users WHERE role = 'admin'");
      for (const admin of admins) {
        await this.notify(admin.id, title, message, type, referenceId, referenceType);
      }
    } catch (err) {
      console.error('Failed to notify admins:', err);
    }
  }

  /**
   * Fetch unread and recent notifications for a user
   */
  async getUserNotifications(userId, limit = 30) {
    const notifications = await query(
      `SELECT * FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ?`,
      [userId, limit]
    );

    const [unread] = await query(
      'SELECT COUNT(*) as unreadCount FROM notifications WHERE user_id = ? AND is_read = 0',
      [userId]
    );

    return {
      notifications,
      unreadCount: unread?.unreadCount || 0
    };
  }

  /**
   * Mark a single notification as read
   */
  async markAsRead(notificationId, userId) {
    await query(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );
    return { success: true };
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId) {
    await query(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ?',
      [userId]
    );
    return { success: true };
  }
}

module.exports = new NotificationService();
