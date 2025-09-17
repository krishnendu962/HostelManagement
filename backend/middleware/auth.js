const AuthService = require('../services/AuthService');

// Verify JWT token middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      error: 'Access denied', 
      message: 'No token provided' 
    });
  }

  try {
    const decoded = AuthService.verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ 
      error: 'Invalid token', 
      message: error.message 
    });
  }
};

// Role-based authorization middleware
const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'User not authenticated' 
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}` 
      });
    }

    next();
  };
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = AuthService.verifyToken(token);
      req.user = decoded;
    } catch (error) {
      // Token is invalid, but we don't fail the request
      console.log('Invalid token in optional auth:', error.message);
    }
  }

  next();
};

// Middleware to check if user is student
const isStudent = authorizeRole('Student');

// Middleware to check if user is warden
const isWarden = authorizeRole('Warden');

// Middleware to check if user is super admin
const isSuperAdmin = authorizeRole('SuperAdmin');

// Middleware to check if user is warden or super admin
const isWardenOrAdmin = authorizeRole('Warden', 'SuperAdmin');

// Middleware to check if user is authenticated (any role)
const isAuthenticated = authenticateToken;

module.exports = {
  authenticateToken,
  authorizeRole,
  optionalAuth,
  isStudent,
  isWarden,
  isSuperAdmin,
  isWardenOrAdmin,
  isAuthenticated
};