const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// In-memory storage for allotment data (replace with database in production)
let allotmentApplications = [];
let studentAllotments = {};

// GET /api/allotment/status - Check student's allotment status
router.get('/status', authenticateToken, (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        
        // Check if student is already allocated
        const allocation = studentAllotments[userId];
        
        if (allocation) {
            return res.json({
                isAllocated: true,
                roomNumber: allocation.roomNumber,
                hostelName: allocation.hostelName,
                roomType: allocation.roomType,
                occupancy: allocation.occupancy,
                floor: allocation.floor,
                allocationDate: allocation.allocationDate
            });
        }
        
        // Check if student has pending application
        const application = allotmentApplications.find(app => app.studentId === userId.toString());
        
        if (application) {
            return res.json({
                isAllocated: false,
                applicationStatus: application.status,
                applicationDate: application.submissionDate,
                expectedProcessingTime: '5-7 business days'
            });
        }
        
        // No allocation or application
        res.json({
            isAllocated: false,
            applicationStatus: null
        });
        
    } catch (error) {
        console.error('Error checking allotment status:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/allotment/register - Submit allotment application
router.post('/register', authenticateToken, (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        const {
            studentId,
            studentName,
            course,
            year,
            phoneNumber,
            hostelPreference,
            roomType,
            floorPreference,
            specialRequirements,
            additionalNotes,
            emergencyContact
        } = req.body;
        
        // Validate required fields
        if (!studentId || !studentName || !course || !year || !phoneNumber || 
            !hostelPreference || !roomType || !emergencyContact) {
            return res.status(400).json({ 
                message: 'Missing required fields' 
            });
        }
        
        // Check if student is already allocated
        if (studentAllotments[userId]) {
            return res.status(400).json({ 
                message: 'You are already allocated to a hostel room' 
            });
        }
        
        // Check if student already has a pending application
        const existingApplication = allotmentApplications.find(app => app.studentId === userId.toString());
        if (existingApplication) {
            return res.status(400).json({ 
                message: 'You already have a pending allotment application' 
            });
        }
        
        // Validate emergency contact
        if (!emergencyContact.name || !emergencyContact.phone || !emergencyContact.relation) {
            return res.status(400).json({ 
                message: 'Complete emergency contact information is required' 
            });
        }
        
        // Create new application
        const application = {
            id: Date.now().toString(),
            studentId: userId.toString(),
            studentName,
            course,
            year: parseInt(year),
            phoneNumber,
            hostelPreference,
            roomType,
            floorPreference,
            specialRequirements,
            additionalNotes,
            emergencyContact,
            status: 'pending',
            submissionDate: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
        };
        
        allotmentApplications.push(application);
        
        res.status(201).json({
            message: 'Allotment application submitted successfully',
            applicationId: application.id,
            status: application.status,
            submissionDate: application.submissionDate
        });
        
    } catch (error) {
        console.error('Error submitting allotment application:', error);
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

module.exports = router;