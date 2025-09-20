const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// GET /api/maintenance/my-requests - Get maintenance requests for logged-in student
router.get('/my-requests', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    console.log('🔧 Getting maintenance requests for user:', userId);
    
    // Get student ID first
    const { StudentModel } = require('../models');
    const student = await StudentModel.findByUserId(userId);
    
    if (!student) {
      // No student record means user hasn't been set up as student - return empty requests
      console.log('ℹ️ No student record found for user:', userId, '- returning empty maintenance requests');
      return res.json({
        success: true,
        data: {
          requests: [],
          message: 'User is not registered as a student'
        }
      });
    }
    
    // Get maintenance requests from database
    const { query } = require('../config/database');
    
    const requestsQuery = `
      SELECT 
        mr.request_id,
        mr.category,
        mr.description,
        mr.priority,
        mr.status,
        mr.created_at as request_date,
        mr.updated_at as completion_date,
        r.room_no,
        h.hostel_name
      FROM maintenance_requests mr
      LEFT JOIN rooms r ON mr.room_id = r.room_id
      LEFT JOIN hostels h ON r.hostel_id = h.hostel_id
      WHERE mr.student_id = $1
      ORDER BY mr.created_at DESC
    `;
    
    const result = await query(requestsQuery, [student.student_id]);
    const requests = result.rows;
    
    console.log('📋 Found maintenance requests:', {
      studentId: student.student_id,
      requestCount: requests.length
    });
    
    res.json({
      success: true,
      data: {
        requests: requests.map(request => ({
          id: request.request_id,
          title: request.category,
          description: request.description,
          priority: request.priority,
          status: request.status,
          date: request.request_date,
          completionDate: request.completion_date,
          roomNumber: request.room_no,
          hostelName: request.hostel_name
        }))
      }
    });
  } catch (error) {
    console.error('Get maintenance requests error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to get maintenance requests',
      message: error.message
    });
  }
});

// POST /api/maintenance/submit - Submit new maintenance request
router.post('/submit', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { type, description, priority } = req.body;
    
    console.log('📝 Submitting maintenance request:', { userId, type, description, priority });
    
    // Get student ID
    const { StudentModel } = require('../models');
    const student = await StudentModel.findByUserId(userId);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student record not found'
      });
    }
    
    // Get student's current room
    const { query } = require('../config/database');
    
    const roomQuery = `
      SELECT r.room_id
      FROM room_allotments ra
      JOIN rooms r ON ra.room_id = r.room_id
      WHERE ra.student_id = $1 AND ra.status = 'Active'
      ORDER BY ra.allotment_date DESC
      LIMIT 1
    `;
    
    const roomResult = await query(roomQuery, [student.student_id]);
    const roomId = roomResult.rows[0]?.room_id;
    
    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: 'No room allocation found. Cannot submit maintenance request.'
      });
    }
    
    // Insert maintenance request
    const insertQuery = `
      INSERT INTO maintenance_requests (student_id, room_id, category, description, priority, status, created_at)
      VALUES ($1, $2, $3, $4, $5, 'Pending', CURRENT_TIMESTAMP)
      RETURNING request_id, created_at as request_date
    `;
    
    const insertResult = await query(insertQuery, [
      student.student_id,
      roomId,
      type,
      description,
      priority || 'Medium'
    ]);
    
    const newRequest = insertResult.rows[0];
    
    console.log('✅ Maintenance request submitted:', {
      requestId: newRequest.request_id,
      studentId: student.student_id,
      roomId
    });
    
    res.json({
      success: true,
      message: 'Maintenance request submitted successfully',
      data: {
        requestId: newRequest.request_id,
        submissionDate: newRequest.request_date
      }
    });
  } catch (error) {
    console.error('Submit maintenance request error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to submit maintenance request',
      message: error.message
    });
  }
});

module.exports = router;