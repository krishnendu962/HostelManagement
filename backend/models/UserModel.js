const BaseModel = require('./BaseModel');
const { query } = require('../config/database');
const bcrypt = require('bcryptjs');

class UserModel extends BaseModel {
  constructor() {
    super('users');
  }

  // Hash password before creating user
  async create(userData) {
    try {
      if (userData.password) {
        const saltRounds = 10;
        userData.password_hash = await bcrypt.hash(userData.password, saltRounds);
        delete userData.password; // Remove plain password
      }

      return await super.create(userData);
    } catch (error) {
      console.error('Error creating user:', error.message);
      throw error;
    }
  }

  // Find user by username
  async findByUsername(username) {
    try {
      const queryText = 'SELECT * FROM users WHERE username = $1';
      const result = await query(queryText, [username]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding user by username:', error.message);
      throw error;
    }
  }

  // Find user by email
  async findByEmail(email) {
    try {
      const queryText = 'SELECT * FROM users WHERE email = $1';
      const result = await query(queryText, [email]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding user by email:', error.message);
      throw error;
    }
  }

  // Verify password
  async verifyPassword(plainPassword, hashedPassword) {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      console.error('Error verifying password:', error.message);
      throw error;
    }
  }

  // Update password
  async updatePassword(userId, newPassword) {
    try {
      const saltRounds = 10;
      const password_hash = await bcrypt.hash(newPassword, saltRounds);
      
      return await this.update(userId, { password_hash }, 'user_id');
    } catch (error) {
      console.error('Error updating password:', error.message);
      throw error;
    }
  }

  // Update last login
  async updateLastLogin(userId) {
    try {
      const queryText = 'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1 RETURNING *';
      const result = await query(queryText, [userId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error updating last login:', error.message);
      throw error;
    }
  }

  // Get users by role
  async findByRole(role) {
    try {
      const queryText = 'SELECT * FROM users WHERE role = $1 ORDER BY username';
      const result = await query(queryText, [role]);
      return result.rows;
    } catch (error) {
      console.error('Error finding users by role:', error.message);
      throw error;
    }
  }

  // Get user with additional info (excluding password)
  async findByIdSafe(userId) {
    try {
      const queryText = `
        SELECT user_id, username, role, email, phone, created_at, last_login
        FROM users 
        WHERE user_id = $1
      `;
      const result = await query(queryText, [userId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding user safely:', error.message);
      throw error;
    }
  }

  // Override findById to exclude password by default
  async findById(userId) {
    return await this.findByIdSafe(userId);
  }
}

module.exports = new UserModel();