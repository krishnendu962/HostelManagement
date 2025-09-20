const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { query } = require('../config/database');

// In-memory storage for allotment data (replace with database in production)
let allotmentApplications = [];
let studentAllotments = {};

// GET /api/allotment/status - Check student's allotment status
router.get('/status', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        console.log('🔍 Checking allotment status for user:', userId);
        
        // Check if student has an active room allocation
        const allocationQuery = await query(`
            SELECT ra.*, r.room_no, h.hostel_name, h.hostel_type
            FROM room_allotments ra
            JOIN rooms r ON ra.room_id = r.room_id
            JOIN hostels h ON r.hostel_id = h.hostel_id
            WHERE ra.student_id = $1 AND ra.status = $2
        `, [userId, 'Allocated']);
        
        if (allocationQuery.rows.length > 0) {
            const allocation = allocationQuery.rows[0];
            return res.json({
                isAllocated: true,
                roomNumber: allocation.room_no,
                hostelName: allocation.hostel_name,
                hostelType: allocation.hostel_type,
                allocationDate: allocation.allotment_date,
                status: allocation.status
            });
        }
        
        // Check if student has a pending application
        const applicationQuery = await query(`
            SELECT aa.*, h.hostel_name
            FROM allotment_applications aa
            LEFT JOIN hostels h ON aa.preferred_hostel_id = h.hostel_id
            WHERE aa.user_id = $1 AND aa.status = $2
            ORDER BY aa.created_at DESC
            LIMIT 1
        `, [userId, 'pending']);
        
        if (applicationQuery.rows.length > 0) {
            const application = applicationQuery.rows[0];
            return res.json({
                isAllocated: false,
                applicationStatus: application.status,
                applicationDate: application.created_at,
                expectedProcessingTime: '5-7 business days',
                applicationId: application.application_id,
                preferredHostel: application.hostel_name || 'Not specified',
                roomType: application.room_type_preference
            });
        }
        
        // No allocation or application
        res.json({
            isAllocated: false,
            applicationStatus: null
        });
        
    } catch (error) {
        console.error('❌ Error checking allotment status:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /api/allotment/hostels - Get available hostels
router.get('/hostels', authenticateToken, async (req, res) => {
    try {
        console.log('🏨 Fetching available hostels...');
        
        const hostelsQuery = await query(`
            SELECT hostel_id, hostel_name, hostel_type, total_rooms, location,
                   (SELECT COUNT(*) FROM rooms WHERE hostel_id = h.hostel_id AND status = 'Vacant') as available_rooms
            FROM hostels h
            ORDER BY hostel_name
        `);
        
        const hostels = hostelsQuery.rows.map(hostel => ({
            id: hostel.hostel_id,
            name: hostel.hostel_name,
            type: hostel.hostel_type,
            totalRooms: hostel.total_rooms,
            availableRooms: hostel.available_rooms,
            location: hostel.location
        }));
        
        console.log(`✅ Found ${hostels.length} hostels`);
        res.json(hostels);
        
    } catch (error) {
        console.error('❌ Error fetching hostels:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/allotment/register - Submit allotment application
router.post('/register', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        const {
            studentId,
            studentName,
            course,
            yearOfStudy,
            academicScore,
            phoneNumber,
            emergencyContactName,
            emergencyContactPhone,
            relationship,
            homeAddress,
            distanceFromHome,
            distanceUnit,
            medicalInfo,
            specialRequests,
            hostelPreference,
            roomType,
            floorPreference,
            additionalNotes
        } = req.body;
        
        console.log('📝 Processing allotment application for user:', userId);
        console.log('📋 Form data received:', req.body);
        
        // Validate required fields
        if (!studentId || !studentName || !course || !yearOfStudy || !academicScore || 
            !phoneNumber || !emergencyContactName || !emergencyContactPhone || !relationship ||
            !homeAddress || !distanceFromHome || !distanceUnit || !hostelPreference || !roomType) {
            return res.status(400).json({ 
                message: 'Missing required fields' 
            });
        }
        
        // Check if student is already allocated a room
        const existingAllocation = await query(
            'SELECT * FROM room_allotments WHERE student_id = $1 AND status = $2',
            [userId, 'Allocated']
        );
        
        if (existingAllocation.rows.length > 0) {
            return res.status(400).json({ 
                message: 'You are already allocated to a hostel room' 
            });
        }
        
        // Check if student already has a pending application
        const existingApplication = await query(
            'SELECT * FROM allotment_applications WHERE user_id = $1 AND status = $2',
            [userId, 'pending']
        );
        
        if (existingApplication.rows.length > 0) {
            return res.status(400).json({ 
                message: 'You already have a pending allotment application' 
            });
        }
        
        // Map hostel preference to hostel_id
        let preferredHostelId = null;
        if (hostelPreference && hostelPreference !== '') {
            // Try to find hostel by ID first, then by name or type
            if (!isNaN(hostelPreference)) {
                preferredHostelId = parseInt(hostelPreference);
            } else {
                const hostelResult = await query(
                    'SELECT hostel_id FROM hostels WHERE LOWER(hostel_name) LIKE LOWER($1) OR LOWER(hostel_type) LIKE LOWER($1) LIMIT 1',
                    [`%${hostelPreference}%`]
                );
                if (hostelResult.rows.length > 0) {
                    preferredHostelId = hostelResult.rows[0].hostel_id;
                }
            }
        }
        
        // Determine performance type and value based on year
    const performanceType = parseInt(yearOfStudy) === 1 ? 'keam_rank' : 'cgpa';
        const performanceValue = parseFloat(academicScore);
        
        // Generate unique application ID
        const applicationId = `APP${Date.now()}`;
        
        // Insert application into database
        const insertResult = await query(`
            INSERT INTO allotment_applications (
                application_id, user_id, preferred_hostel_id, room_type_preference,
                course, academic_year, performance_type, performance_value,
                distance_from_home, distance_unit, guardian_name, guardian_phone,
                home_address, medical_info, special_requests, status
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
            ) RETURNING id, created_at
        `, [
            applicationId,
            userId,
            preferredHostelId,
            roomType,
            course,
            yearOfStudy,
            performanceType,
            performanceValue,
            distanceFromHome,
            distanceUnit || 'km',
            emergencyContactName,
            emergencyContactPhone,
            homeAddress,
            medicalInfo || null,
            specialRequests || null,
            'pending'
        ]);
        
        console.log('✅ Application inserted successfully:', insertResult.rows[0]);
        
        res.status(201).json({
            message: 'Allotment application submitted successfully',
            applicationId: applicationId,
            status: 'pending',
            submissionDate: insertResult.rows[0].created_at
        });
        
    } catch (error) {
        console.error('❌ Error submitting allotment application:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /api/allotment/application/:id - Get application details
router.get('/application/:id', authenticateToken, (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        const applicationId = req.params.id;
        
        const application = allotmentApplications.find(app => 
            app.id === applicationId && app.studentId === userId.toString()
        );
        
        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }
        
        res.json(application);
        
    } catch (error) {
        console.error('Error fetching application:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /api/allotment/applications - Get student's applications
router.get('/applications', authenticateToken, (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        
        const userApplications = allotmentApplications.filter(app => 
            app.studentId === userId.toString()
        );
        
        res.json(userApplications);
        
    } catch (error) {
        console.error('Error fetching applications:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/allotment/allocate - Allocate room to student (Admin/Warden only)
router.post('/allocate', authenticateToken, (req, res) => {
    try {
        const userRole = req.user.role;
        
        // Check if user has permission to allocate rooms
        if (userRole !== 'Admin' && userRole !== 'SuperAdmin' && userRole !== 'Warden') {
            return res.status(403).json({ message: 'Insufficient permissions' });
        }
        
        const {
            studentId,
            roomNumber,
            hostelName,
            roomType,
            occupancy,
            floor
        } = req.body;
        
        if (!studentId || !roomNumber || !hostelName || !roomType) {
            return res.status(400).json({ 
                message: 'Missing required allocation details' 
            });
        }
        
        // Check if student is already allocated
        if (studentAllotments[studentId]) {
            return res.status(400).json({ 
                message: 'Student is already allocated to a room' 
            });
        }
        
        // Create allocation
        studentAllotments[studentId] = {
            roomNumber,
            hostelName,
            roomType,
            occupancy: occupancy || 'Single',
            floor: floor || '1',
            allocationDate: new Date().toISOString(),
            allocatedBy: req.user.id || req.user.userId
        };
        
        // Update application status if exists
        const applicationIndex = allotmentApplications.findIndex(app => 
            app.studentId === studentId.toString()
        );
        
        if (applicationIndex !== -1) {
            allotmentApplications[applicationIndex].status = 'allocated';
            allotmentApplications[applicationIndex].lastUpdated = new Date().toISOString();
        }
        
        res.json({
            message: 'Room allocated successfully',
            allocation: studentAllotments[studentId]
        });
        
    } catch (error) {
        console.error('Error allocating room:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Demo: Add some sample allocations for testing
// In production, this data would come from the database
function initializeDemoData() {
    // Add a sample allocated student for testing
    studentAllotments['demo-student-1'] = {
        roomNumber: 'A-101',
        hostelName: 'Boys Hostel A',
        roomType: 'Double Occupancy',
        occupancy: 'Double',
        floor: '1',
        allocationDate: new Date().toISOString(),
        allocatedBy: 'admin'
    };
}

// Initialize demo data
initializeDemoData();

// GET /api/allotment/my-room - Get current room allocation from database
router.get('/my-room', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    console.log('🏠 Getting room allocation from DB for user:', userId);
    
    // Get student ID first
    const { StudentModel } = require('../models');
    const student = await StudentModel.findByUserId(userId);
    
    if (!student) {
      // No student record means user hasn't been set up as student - this is normal
      console.log('ℹ️ No student record found for user:', userId, '- user is not a student');
      return res.json({
        success: true,
        data: { 
          hasAllocation: false,
          message: 'User is not registered as a student'
        }
      });
    }
    
    // Get current room allocation from database
    const { query } = require('../config/database');
    
    const allotmentQuery = `
      SELECT 
        ra.allotment_id,
        ra.allotment_date,
        ra.status,
        r.room_no,
        r.capacity,
        h.hostel_name,
        h.hostel_type,
        h.location
      FROM room_allotments ra
      JOIN rooms r ON ra.room_id = r.room_id
      JOIN hostels h ON r.hostel_id = h.hostel_id
      WHERE ra.student_id = $1 AND ra.status = 'Active'
      ORDER BY ra.allotment_date DESC
      LIMIT 1
    `;
    
    const result = await query(allotmentQuery, [student.student_id]);
    const allocation = result.rows[0];
    
    if (!allocation) {
      console.log('⚠️ No active room allocation found for student:', student.student_id);
      return res.json({
        success: true,
        data: { 
          hasAllocation: false,
          message: 'No room currently allocated'
        }
      });
    }
    
    console.log('✅ Room allocation found:', {
      studentId: student.student_id,
      roomNo: allocation.room_no,
      hostel: allocation.hostel_name
    });
    
    res.json({
      success: true,
      data: {
        hasAllocation: true,
        allocation: {
          roomNumber: allocation.room_no,
          hostelName: allocation.hostel_name,
          hostelType: allocation.hostel_type,
          location: allocation.location,
          capacity: allocation.capacity,
          allottedDate: allocation.allotment_date,
          status: allocation.status,
          floor: Math.floor(parseInt(allocation.room_no) / 100) || 1 // Calculate floor from room number
        }
      }
    });
  } catch (error) {
    console.error('Get room allocation error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to get room allocation',
      message: error.message
    });
  }
});

module.exports = router;