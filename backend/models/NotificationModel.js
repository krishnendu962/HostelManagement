const BaseModel = require('./BaseModel');
const { query } = require('../config/database');

class NotificationModel extends BaseModel {
  constructor() {
    super('notifications');
  }

  // Create notification for specific user
  async createForUser(senderId, receiverId, title, message) {
    try {
      const notificationData = {
        sender_id: senderId,
        receiver_id: receiverId,
        receiver_role: null, // Will be determined by receiver_id
        title,
        message
      };

      return await super.create(notificationData);
    } catch (error) {
      console.error('Error creating user notification:', error.message);
      throw error;
    }
  }

  // Create notification for all users with specific role
  async createForRole(senderId, receiverRole, title, message) {
    try {
      const notificationData = {
        sender_id: senderId,
        receiver_id: null,
        receiver_role: receiverRole,
        title,
        message
      };

      return await super.create(notificationData);
    } catch (error) {
      console.error('Error creating role notification:', error.message);
      throw error;
    }
  }

  // Create notification for all users
  async createForAll(senderId, title, message) {
    try {
      const notificationData = {
        sender_id: senderId,
        receiver_id: null,
        receiver_role: 'All',
        title,
        message
      };

      return await super.create(notificationData);
    } catch (error) {
      console.error('Error creating global notification:', error.message);
      throw error;
    }
  }

  // Get notifications for a specific user
  async findForUser(userId) {
    try {
      const queryText = `
        SELECT 
          n.*,
          u.username as sender_name
        FROM notifications n
        LEFT JOIN users u ON n.sender_id = u.user_id
        WHERE n.receiver_id = $1 
           OR (n.receiver_role = 'All')
           OR (n.receiver_role = (SELECT role FROM users WHERE user_id = $1))
        ORDER BY n.created_at DESC
      `;
      const result = await query(queryText, [userId]);
      return result.rows;
    } catch (error) {
      console.error('Error finding notifications for user:', error.message);
      throw error;
    }
  }

  // Get recent notifications for a user (last 10)
  async findRecentForUser(userId, limit = 10) {
    try {
      const queryText = `
        SELECT 
          n.*,
          u.username as sender_name
        FROM notifications n
        LEFT JOIN users u ON n.sender_id = u.user_id
        WHERE n.receiver_id = $1 
           OR (n.receiver_role = 'All')
           OR (n.receiver_role = (SELECT role FROM users WHERE user_id = $1))
        ORDER BY n.created_at DESC
        LIMIT $2
      `;
      const result = await query(queryText, [userId, limit]);
      return result.rows;
    } catch (error) {
      console.error('Error finding recent notifications:', error.message);
      throw error;
    }
  }

  // Get notifications by role
  async findByRole(role) {
    try {
      const queryText = `
        SELECT 
          n.*,
          u.username as sender_name
        FROM notifications n
        LEFT JOIN users u ON n.sender_id = u.user_id
        WHERE n.receiver_role = $1 OR n.receiver_role = 'All'
        ORDER BY n.created_at DESC
      `;
      const result = await query(queryText, [role]);
      return result.rows;
    } catch (error) {
      console.error('Error finding notifications by role:', error.message);
      throw error;
    }
  }

  // Get all notifications sent by a user
  async findBySender(senderId) {
    try {
      const queryText = `
        SELECT 
          n.*,
          CASE 
            WHEN n.receiver_id IS NOT NULL THEN u.username
            ELSE n.receiver_role
          END as receiver_info
        FROM notifications n
        LEFT JOIN users u ON n.receiver_id = u.user_id
        WHERE n.sender_id = $1
        ORDER BY n.created_at DESC
      `;
      const result = await query(queryText, [senderId]);
      return result.rows;
    } catch (error) {
      console.error('Error finding notifications by sender:', error.message);
      throw error;
    }
  }

  // Get notification statistics
  async getStatistics() {
    try {
      const queryText = `
        SELECT 
          COUNT(*) as total_notifications,
          COUNT(CASE WHEN receiver_role = 'All' THEN 1 END) as global_notifications,
          COUNT(CASE WHEN receiver_role = 'Student' THEN 1 END) as student_notifications,
          COUNT(CASE WHEN receiver_role = 'Warden' THEN 1 END) as warden_notifications,
          COUNT(CASE WHEN receiver_id IS NOT NULL THEN 1 END) as individual_notifications,
          COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as recent_notifications
        FROM notifications
      `;
      const result = await query(queryText);
      return result.rows[0];
    } catch (error) {
      console.error('Error getting notification statistics:', error.message);
      throw error;
    }
  }

  // Delete old notifications (older than specified days)
  async deleteOld(daysOld = 30) {
    try {
      const queryText = `
        DELETE FROM notifications 
        WHERE created_at < CURRENT_DATE - INTERVAL '${daysOld} days'
        RETURNING COUNT(*) as deleted_count
      `;
      const result = await query(queryText);
      return result.rows[0];
    } catch (error) {
      console.error('Error deleting old notifications:', error.message);
      throw error;
    }
  }

  // Search notifications
  async search(filters = {}) {
    try {
      let queryText = `
        SELECT 
          n.*,
          u.username as sender_name,
          CASE 
            WHEN n.receiver_id IS NOT NULL THEN ru.username
            ELSE n.receiver_role
          END as receiver_info
        FROM notifications n
        LEFT JOIN users u ON n.sender_id = u.user_id
        LEFT JOIN users ru ON n.receiver_id = ru.user_id
        WHERE 1=1
      `;
      
      const values = [];
      let paramCount = 0;

      if (filters.sender_id) {
        paramCount++;
        queryText += ` AND n.sender_id = $${paramCount}`;
        values.push(filters.sender_id);
      }

      if (filters.receiver_role) {
        paramCount++;
        queryText += ` AND n.receiver_role = $${paramCount}`;
        values.push(filters.receiver_role);
      }

      if (filters.title) {
        paramCount++;
        queryText += ` AND n.title ILIKE $${paramCount}`;
        values.push(`%${filters.title}%`);
      }

      if (filters.message) {
        paramCount++;
        queryText += ` AND n.message ILIKE $${paramCount}`;
        values.push(`%${filters.message}%`);
      }

      if (filters.date_from) {
        paramCount++;
        queryText += ` AND n.created_at >= $${paramCount}`;
        values.push(filters.date_from);
      }

      if (filters.date_to) {
        paramCount++;
        queryText += ` AND n.created_at <= $${paramCount}`;
        values.push(filters.date_to);
      }

      queryText += ' ORDER BY n.created_at DESC';

      const result = await query(queryText, values);
      return result.rows;
    } catch (error) {
      console.error('Error searching notifications:', error.message);
      throw error;
    }
  }

  // Mark notification as read (if you want to add read status later)
  async markAsRead(notificationId, userId) {
    try {
      // This is a placeholder for future functionality
      // You could add a 'read' table to track which users have read which notifications
      console.log(`Notification ${notificationId} marked as read by user ${userId}`);
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error.message);
      throw error;
    }
  }

  // Bulk create notifications (for efficient mass notifications)
  async bulkCreate(notifications) {
    try {
      if (!notifications.length) return [];

      const values = [];
      const placeholders = [];
      
      notifications.forEach((notification, index) => {
        const baseIndex = index * 5;
        placeholders.push(`($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5})`);
        values.push(
          notification.sender_id,
          notification.receiver_id,
          notification.receiver_role,
          notification.title,
          notification.message
        );
      });

      const queryText = `
        INSERT INTO notifications (sender_id, receiver_id, receiver_role, title, message)
        VALUES ${placeholders.join(', ')}
        RETURNING *
      `;

      const result = await query(queryText, values);
      return result.rows;
    } catch (error) {
      console.error('Error bulk creating notifications:', error.message);
      throw error;
    }
  }
}

module.exports = new NotificationModel();