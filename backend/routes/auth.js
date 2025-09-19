const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const AuthService = require('../services/AuthService');
const { isAuthenticated } = require('../middleware/auth');

// Admin codes for secure registration
const ADMIN_CODES = {
  Warden: process.env.WARDEN_CODE || 'WARDEN2025',
  SuperAdmin: process.env.SUPERADMIN_CODE || 'SUPERADMIN2025'
};

// Validation middleware
const loginValidation = [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
];

const registerValidation = [
  body('username')
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters long'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Must be a valid email address'),
  body('role')
    .isIn(['Student', 'Warden', 'SuperAdmin'])
    .withMessage('Role must be Student, Warden, or SuperAdmin'),
  body('phone')
    .optional()
    .isLength({ min: 10 })
    .withMessage('Phone number must be at least 10 digits'),
  body('adminCode')
    .custom((value, { req }) => {
      const role = req.body.role;
      
      // Admin code is required for Warden and SuperAdmin roles
      if (role === 'Warden' || role === 'SuperAdmin') {
        if (!value) {
          throw new Error('Admin authorization code is required for this role');
        }
        
        // Validate the admin code
        if (value !== ADMIN_CODES[role]) {
          throw new Error('Invalid admin authorization code');
        }
      }
      
      return true;
    })
];

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// POST /api/auth/login
router.post('/login', loginValidation, handleValidationErrors, async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const result = await AuthService.login(username, password);
    
    res.json({
      success: true,
      message: 'Login successful',
      data: result
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Login failed',
      message: error.message
    });
  }
});

// POST /api/auth/register
router.post('/register', registerValidation, handleValidationErrors, async (req, res) => {
  try {
    console.log('Full registration request body:', req.body);
    
    // Explicitly extract only the fields we want for the database
    const userData = {
      username: req.body.username,
      email: req.body.email,
      phone: req.body.phone,
      password: req.body.password,
      role: req.body.role
    };
    
    console.log('Filtered user data for database:', userData);
    console.log('Admin code (validation only):', req.body.adminCode);
    
    const result = await AuthService.register(userData);
    
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: result
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({
      success: false,
      error: 'Registration failed',
      message: error.message
    });
  }
});

// GET /api/auth/profile
router.get('/profile', isAuthenticated, async (req, res) => {
  try {
    const user = req.user;
    
    res.json({
      success: true,
      message: 'Profile retrieved successfully',
      data: { user }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get profile',
      message: error.message
    });
  }
});

// POST /api/auth/logout
router.post('/logout', isAuthenticated, async (req, res) => {
  try {
    // In a production app, you might want to blacklist the token
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Logout failed',
      message: error.message
    });
  }
});

// POST /api/auth/verify-token
router.post('/verify-token', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token required',
        message: 'No token provided'
      });
    }

    const decoded = AuthService.verifyToken(token);
    
    res.json({
      success: true,
      message: 'Token is valid',
      data: { user: decoded }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid token',
      message: error.message
    });
  }
});

// POST /api/auth/change-password
router.post('/change-password', isAuthenticated, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long')
], handleValidationErrors, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    // For demo purposes, we'll simulate password validation
    // In a real app, you'd verify against the database
    if (currentPassword !== 'password123') {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Simulate successful password change
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Password change failed',
      message: error.message
    });
  }
});

// PUT /api/auth/profile
router.put('/profile', isAuthenticated, [
  body('email').optional().isEmail().withMessage('Must be a valid email address'),
  body('phone').optional().isLength({ min: 10 }).withMessage('Phone number must be at least 10 digits'),
  body('fullName').optional().isLength({ min: 2 }).withMessage('Full name must be at least 2 characters'),
  body('course').optional().isLength({ min: 1 }).withMessage('Course cannot be empty'),
  body('year').optional().isIn(['1', '2', '3', '4']).withMessage('Year must be 1, 2, 3, or 4'),
  body('studentId').optional().isLength({ min: 1 }).withMessage('Student ID cannot be empty')
], handleValidationErrors, async (req, res) => {
  try {
    const userId = req.user.userId;
    const updateData = req.body;
    
    // For demo purposes, we'll just return success with the updated data
    // In a real app, you'd update the database and return the updated user
    const updatedUser = {
      ...req.user,
      ...updateData,
      id: userId,
      userId: userId
    };
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: updatedUser }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Profile update failed',
      message: error.message
    });
  }
});

module.exports = router;