const Notification = require('../models/Notification');

/**
 * Get user notifications
 * @route GET /api/notifications
 */
exports.getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit, offset, unreadOnly, type } = req.query;
    
    // Parse query parameters
    const options = {
      limit: limit ? parseInt(limit) : 20,
      offset: offset ? parseInt(offset) : 0,
      unreadOnly: unreadOnly === 'true',
      type: type || null
    };
    
    // Get notifications for the user
    const notifications = await Notification.findByUserId(userId, options);
    
    // Get unread count
    const unreadCount = await Notification.countUnread(userId);
    
    res.status(200).json({
      success: true,
      count: notifications.length,
      unreadCount,
      data: notifications
    });
  } catch (error) {
    console.error('Error getting user notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notifications',
      error: error.message
    });
  }
};

/**
 * Mark a notification as read
 * @route PUT /api/notifications/:id/read
 */
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Mark notification as read
    const notification = await Notification.markAsRead(id, userId);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found or not owned by user'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
};

/**
 * Mark all notifications as read
 * @route PUT /api/notifications/read-all
 */
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Mark all notifications as read
    const updatedCount = await Notification.markAllAsRead(userId);
    
    res.status(200).json({
      success: true,
      message: `${updatedCount} notifications marked as read`,
      count: updatedCount
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: error.message
    });
  }
};

/**
 * Delete a notification
 * @route DELETE /api/notifications/:id
 */
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Delete notification
    const success = await Notification.delete(id, userId);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found or not owned by user'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message
    });
  }
};

/**
 * Delete all notifications
 * @route DELETE /api/notifications/all
 */
exports.deleteAllNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Delete all notifications
    const deletedCount = await Notification.deleteAll(userId);
    
    res.status(200).json({
      success: true,
      message: `${deletedCount} notifications deleted successfully`,
      count: deletedCount
    });
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete all notifications',
      error: error.message
    });
  }
};