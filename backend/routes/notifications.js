const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// GET /api/notifications/my-notifications - Get personalized notifications for student
router.get('/my-notifications', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    console.log('📢 Getting notifications for user:', userId);
    
    // Get student info
    const { StudentModel } = require('../models');
    const student = await StudentModel.findByUserId(userId);
    
    const { query } = require('../config/database');
    let notifications = [];
    
    if (!student) {
      // User is not a student - show general notifications
      notifications.push({
        id: 'no-student-record',
        title: '📋 Student Registration Required',
        message: 'Complete your student profile to access hostel services and room allocation.',
        type: 'info',
        date: new Date().toISOString(),
        priority: 'high'
      });
    } else {
      // Check if student has room allocation
      const roomQuery = `
        SELECT ra.*, r.room_no, h.hostel_name, h.hostel_type
        FROM room_allotments ra
        JOIN rooms r ON ra.room_id = r.room_id
        JOIN hostels h ON r.hostel_id = h.hostel_id
        WHERE ra.student_id = $1 AND ra.status = 'Active'
        ORDER BY ra.allotment_date DESC
        LIMIT 1
      `;
      
      const roomResult = await query(roomQuery, [student.student_id]);
      const hasRoom = roomResult.rows.length > 0;
      
      if (!hasRoom) {
        // No room allocation - show vacant hostels and allocation info
        
        // Get vacant rooms count
        const vacantRoomsQuery = `
          SELECT h.hostel_name, h.hostel_type, COUNT(r.room_id) as vacant_rooms
          FROM hostels h
          JOIN rooms r ON h.hostel_id = r.hostel_id
          WHERE r.status = 'Vacant'
          GROUP BY h.hostel_id, h.hostel_name, h.hostel_type
          HAVING COUNT(r.room_id) > 0
          ORDER BY COUNT(r.room_id) DESC
        `;
        
        const vacantResult = await query(vacantRoomsQuery);
        const vacantHostels = vacantResult.rows;
        
        if (vacantHostels.length > 0) {
          const hostelList = vacantHostels.map(h => 
            `${h.hostel_name} (${h.hostel_type}) - ${h.vacant_rooms} rooms available`
          ).join(', ');
          
          notifications.push({
            id: 'vacant-hostels',
            title: '🏠 Hostel Rooms Available',
            message: `Vacant rooms found in: ${hostelList}. Contact administration for room allocation.`,
            type: 'success',
            date: new Date().toISOString(),
            priority: 'high'
          });
        }
        
        notifications.push({
          id: 'no-room-allocation',
          title: '📍 Room Allocation Pending',
          message: 'You haven\'t been assigned a hostel room yet. Please contact the hostel administration to apply for room allocation.',
          type: 'warning',
          date: new Date().toISOString(),
          priority: 'high'
        });
      } else {
        // Has room - show room-related notifications
        const currentRoom = roomResult.rows[0];
        
        notifications.push({
          id: 'current-room',
          title: '🎉 Room Allocated',
          message: `You are allocated to Room ${currentRoom.room_no} in ${currentRoom.hostel_name} (${currentRoom.hostel_type}).`,
          type: 'success',
          date: currentRoom.allotment_date,
          priority: 'normal'
        });
        
        // Check for pending maintenance requests
        const maintenanceQuery = `
          SELECT COUNT(*) as pending_count
          FROM maintenance_requests mr
          WHERE mr.student_id = $1 AND mr.status IN ('Pending', 'In Progress')
        `;
        
        const maintenanceResult = await query(maintenanceQuery, [student.student_id]);
        const pendingRequests = parseInt(maintenanceResult.rows[0].pending_count);
        
        if (pendingRequests > 0) {
          notifications.push({
            id: 'pending-maintenance',
            title: '🔧 Maintenance Updates',
            message: `You have ${pendingRequests} maintenance request(s) being processed. Check your maintenance section for updates.`,
            type: 'info',
            date: new Date().toISOString(),
            priority: 'normal'
          });
        }
      }
      
      // Get actual notifications from database if they exist
      const dbNotificationsQuery = `
        SELECT 
          n.notification_id,
          n.title,
          n.message,
          n.type,
          n.created_at,
          n.is_read
        FROM notifications n
        WHERE n.user_id = $1 OR n.user_id IS NULL
        ORDER BY n.created_at DESC
        LIMIT 10
      `;
      
      try {
        const dbNotifications = await query(dbNotificationsQuery, [userId]);
        const formattedDbNotifications = dbNotifications.rows.map(notif => ({
          id: `db-${notif.notification_id}`,
          title: notif.title,
          message: notif.message,
          type: notif.type,
          date: notif.created_at,
          priority: 'normal',
          isRead: notif.is_read
        }));
        
        // Add database notifications to the list
        notifications = [...notifications, ...formattedDbNotifications];
      } catch (dbError) {
        console.log('ℹ️ No notifications table found, using dynamic notifications only');
      }
    }
    
    // Add general system notifications
    notifications.push({
      id: 'system-welcome',
      title: '👋 Welcome to Hostel Management',
      message: 'Use this dashboard to manage your hostel allocation, submit maintenance requests, and stay updated.',
      type: 'info',
      date: new Date().toISOString(),
      priority: 'low'
    });
    
    // Sort by priority and date
    const priorityOrder = { 'high': 3, 'normal': 2, 'low': 1 };
    notifications.sort((a, b) => {
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return new Date(b.date) - new Date(a.date);
    });
    
    console.log('📢 Generated notifications:', {
      count: notifications.length,
      hasStudent: !!student,
      types: notifications.map(n => n.type)
    });
    
    res.json({
      success: true,
      data: {
        notifications: notifications.slice(0, 5), // Limit to 5 most relevant
        totalCount: notifications.length
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to get notifications',
      message: error.message
    });
  }
});

module.exports = router;