const pool = require('../config/db');

/**
 * Notification model with methods for CRUD operations
 */
const Notification = {
  /**
   * Create a new notification
   * @param {Object} notificationData - Notification data
   * @returns {Promise<Object>} Created notification
   */
  create: async (notificationData) => {
    const {
      userId,
      type,
      title,
      message,
      relatedId = null,
      isRead = false
    } = notificationData;
    
    const query = `
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        related_id,
        is_read,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *
    `;
    
    const values = [userId, type, title, message, relatedId, isRead];
    const result = await pool.query(query, values);
    
    return result.rows[0];
  },
  
  /**
   * Find a notification by ID
   * @param {number} id - Notification ID
   * @returns {Promise<Object>} Notification
   */
  findById: async (id) => {
    const query = `SELECT * FROM notifications WHERE id = $1`;
    const result = await pool.query(query, [id]);
    
    return result.rows[0];
  },
  
  /**
   * Find notifications for a user
   * @param {number} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Notifications
   */
  findByUserId: async (userId, options = {}) => {
    const {
      limit = 20,
      offset = 0,
      unreadOnly = false,
      type = null
    } = options;
    
    let query = `SELECT * FROM notifications WHERE user_id = $1`;
    const params = [userId];
    let paramIndex = 2;
    
    if (unreadOnly) {
      query += ` AND is_read = false`;
    }
    
    if (type) {
      query += ` AND type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    return result.rows;
  },
  
  /**
   * Count unread notifications for a user
   * @param {number} userId - User ID
   * @returns {Promise<number>} Count of unread notifications
   */
  countUnread: async (userId) => {
    const query = `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false`;
    const result = await pool.query(query, [userId]);
    
    return parseInt(result.rows[0].count);
  },
  
  /**
   * Mark a notification as read
   * @param {number} id - Notification ID
   * @param {number} userId - User ID (for authorization)
   * @returns {Promise<Object>} Updated notification
   */
  markAsRead: async (id, userId) => {
    const query = `
      UPDATE notifications
      SET is_read = true
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;
    
    const result = await pool.query(query, [id, userId]);
    
    return result.rows[0];
  },
  
  /**
   * Mark all notifications as read for a user
   * @param {number} userId - User ID
   * @returns {Promise<number>} Number of notifications updated
   */
  markAllAsRead: async (userId) => {
    const query = `
      UPDATE notifications
      SET is_read = true
      WHERE user_id = $1 AND is_read = false
    `;
    
    const result = await pool.query(query, [userId]);
    
    return result.rowCount;
  },
  
  /**
   * Delete a notification
   * @param {number} id - Notification ID
   * @param {number} userId - User ID (for authorization)
   * @returns {Promise<boolean>} Success status
   */
  delete: async (id, userId) => {
    const query = `
      DELETE FROM notifications
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `;
    
    const result = await pool.query(query, [id, userId]);
    
    return result.rows.length > 0;
  },
  
  /**
   * Delete all notifications for a user
   * @param {number} userId - User ID
   * @returns {Promise<number>} Number of notifications deleted
   */
  deleteAll: async (userId) => {
    const query = `
      DELETE FROM notifications
      WHERE user_id = $1
    `;
    
    const result = await pool.query(query, [userId]);
    
    return result.rowCount;
  }
};

module.exports = Notification;