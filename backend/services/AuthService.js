const jwt = require('jsonwebtoken');
const { UserModel } = require('../models');

class AuthService {
  // Generate JWT token
  generateToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '24h' // Token expires in 24 hours
    });
  }

  // Verify JWT token
  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  // Login user
  async login(username, password) {
    try {
      // Find user by username
      const user = await UserModel.findByUsername(username);
      if (!user) {
        throw new Error('Invalid username or password');
      }

      // Verify password
      const isValidPassword = await UserModel.verifyPassword(password, user.password_hash);
      if (!isValidPassword) {
        throw new Error('Invalid username or password');
      }

      // Update last login
      await UserModel.updateLastLogin(user.user_id);

      // Generate token
      const tokenPayload = {
        userId: user.user_id,
        username: user.username,
        role: user.role,
        email: user.email
      };
      const token = this.generateToken(tokenPayload);

      // Return user info (without password) and token
      return {
        user: {
          user_id: user.user_id,
          username: user.username,
          role: user.role,
          email: user.email,
          phone: user.phone,
          created_at: user.created_at,
          last_login: new Date()
        },
        token
      };
    } catch (error) {
      console.error('Login error:', error.message);
      throw error;
    }
  }

  // Register new user
  async register(userData) {
    try {
      // Check if username already exists
      const existingUser = await UserModel.findByUsername(userData.username);
      if (existingUser) {
        throw new Error('Username already exists');
      }

      // Check if email already exists
      if (userData.email) {
        const existingEmail = await UserModel.findByEmail(userData.email);
        if (existingEmail) {
          throw new Error('Email already exists');
        }
      }

      // Create new user (adminCode already filtered out at route level)
      const newUser = await UserModel.create(userData);

      // Generate token for immediate login
      const tokenPayload = {
        userId: newUser.user_id,
        username: newUser.username,
        role: newUser.role,
        email: newUser.email
      };
      const token = this.generateToken(tokenPayload);

      return {
        user: {
          user_id: newUser.user_id,
          username: newUser.username,
          role: newUser.role,
          email: newUser.email,
          phone: newUser.phone,
          created_at: newUser.created_at
        },
        token
      };
    } catch (error) {
      console.error('Registration error:', error.message);
      throw error;
    }
  }

  // Change password
  async changePassword(userId, currentPassword, newPassword) {
    try {
      // Get user with password hash
      const queryText = 'SELECT * FROM users WHERE user_id = $1';
      const { query } = require('../config/database');
      const result = await query(queryText, [userId]);
      const user = result.rows[0];

      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isValidPassword = await UserModel.verifyPassword(currentPassword, user.password_hash);
      if (!isValidPassword) {
        throw new Error('Current password is incorrect');
      }

      // Update password
      await UserModel.updatePassword(userId, newPassword);

      return { message: 'Password updated successfully' };
    } catch (error) {
      console.error('Change password error:', error.message);
      throw error;
    }
  }

  // Refresh token
  async refreshToken(token) {
    try {
      const decoded = this.verifyToken(token);
      
      // Get updated user info
      const user = await UserModel.findByIdSafe(decoded.userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Generate new token
      const tokenPayload = {
        userId: user.user_id,
        username: user.username,
        role: user.role,
        email: user.email
      };
      const newToken = this.generateToken(tokenPayload);

      return {
        user,
        token: newToken
      };
    } catch (error) {
      console.error('Refresh token error:', error.message);
      throw error;
    }
  }

  // Get user profile
  async getProfile(userId) {
    try {
      const user = await UserModel.findByIdSafe(userId);
      if (!user) {
        throw new Error('User not found');
      }
      return user;
    } catch (error) {
      console.error('Get profile error:', error.message);
      throw error;
    }
  }

  // Update user profile
  async updateProfile(userId, updateData) {
    try {
      // Remove sensitive fields that shouldn't be updated via profile
      delete updateData.password;
      delete updateData.password_hash;
      delete updateData.user_id;
      delete updateData.role;

      const updatedUser = await UserModel.update(userId, updateData, 'user_id');
      return updatedUser;
    } catch (error) {
      console.error('Update profile error:', error.message);
      throw error;
    }
  }

  // Logout (token blacklisting would be implemented here if needed)
  async logout(token) {
    try {
      // In a production app, you might want to blacklist the token
      // For now, we'll just return success
      return { message: 'Logged out successfully' };
    } catch (error) {
      console.error('Logout error:', error.message);
      throw error;
    }
  }
}

module.exports = new AuthService();