const BaseModel = require('./BaseModel');
const { query } = require('../config/database');

class StudentModel extends BaseModel {
  constructor() {
    super('students');
  }

  // Find student by registration number
  async findByRegNo(regNo) {
    try {
      const queryText = 'SELECT * FROM students WHERE reg_no = $1';
      const result = await query(queryText, [regNo]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding student by reg_no:', error.message);
      throw error;
    }
  }

  // Find student by user_id
  async findByUserId(userId) {
    try {
      const queryText = 'SELECT * FROM students WHERE user_id = $1';
      const result = await query(queryText, [userId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding student by user_id:', error.message);
      throw error;
    }
  }

  // Get student with user details
  async findStudentWithUser(studentId) {
    try {
      const queryText = `
        SELECT s.*, u.username, u.email, u.phone, u.created_at as user_created_at
        FROM students s
        JOIN users u ON s.user_id = u.user_id
        WHERE s.student_id = $1
      `;
      const result = await query(queryText, [studentId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding student with user details:', error.message);
      throw error;
    }
  }

  // Get students by year of study
  async findByYear(year) {
    try {
      const queryText = `
        SELECT s.*, u.username, u.email
        FROM students s
        JOIN users u ON s.user_id = u.user_id
        WHERE s.year_of_study = $1
        ORDER BY s.name
      `;
      const result = await query(queryText, [year]);
      return result.rows;
    } catch (error) {
      console.error('Error finding students by year:', error.message);
      throw error;
    }
  }

  // Get students by department
  async findByDepartment(department) {
    try {
      const queryText = `
        SELECT s.*, u.username, u.email
        FROM students s
        JOIN users u ON s.user_id = u.user_id
        WHERE s.department = $1
        ORDER BY s.year_of_study, s.name
      `;
      const result = await query(queryText, [department]);
      return result.rows;
    } catch (error) {
      console.error('Error finding students by department:', error.message);
      throw error;
    }
  }

  // Get students by category for allocation priority
  async findByCategory(category) {
    try {
      const queryText = `
        SELECT s.*, u.username, u.email
        FROM students s
        JOIN users u ON s.user_id = u.user_id
        WHERE s.category = $1
        ORDER BY s.keam_rank ASC, s.sgpa DESC
      `;
      const result = await query(queryText, [category]);
      return result.rows;
    } catch (error) {
      console.error('Error finding students by category:', error.message);
      throw error;
    }
  }

  // Get students eligible for allocation (no current active allotment)
  async findEligibleForAllocation() {
    try {
      const queryText = `
        SELECT s.*, u.username, u.email
        FROM students s
        JOIN users u ON s.user_id = u.user_id
        LEFT JOIN room_allotments ra ON s.student_id = ra.student_id AND ra.status = 'Active'
        WHERE ra.allotment_id IS NULL
        ORDER BY s.category, s.keam_rank ASC, s.sgpa DESC
      `;
      const result = await query(queryText);
      return result.rows;
    } catch (error) {
      console.error('Error finding eligible students:', error.message);
      throw error;
    }
  }

  // Get students with current room allocation
  async findWithCurrentRoom() {
    try {
      const queryText = `
        SELECT 
          s.*,
          u.username,
          u.email,
          r.room_no,
          h.hostel_name,
          ra.allotment_date,
          ra.allotment_id
        FROM students s
        JOIN users u ON s.user_id = u.user_id
        JOIN room_allotments ra ON s.student_id = ra.student_id AND ra.status = 'Active'
        JOIN rooms r ON ra.room_id = r.room_id
        JOIN hostels h ON r.hostel_id = h.hostel_id
        ORDER BY h.hostel_name, r.room_no
      `;
      const result = await query(queryText);
      return result.rows;
    } catch (error) {
      console.error('Error finding students with current room:', error.message);
      throw error;
    }
  }

  // Search students by multiple criteria
  async search(filters = {}) {
    try {
      let queryText = `
        SELECT s.*, u.username, u.email
        FROM students s
        JOIN users u ON s.user_id = u.user_id
        WHERE 1=1
      `;
      const values = [];
      let paramCount = 0;

      // Add dynamic filters
      if (filters.name) {
        paramCount++;
        queryText += ` AND s.name ILIKE $${paramCount}`;
        values.push(`%${filters.name}%`);
      }

      if (filters.reg_no) {
        paramCount++;
        queryText += ` AND s.reg_no ILIKE $${paramCount}`;
        values.push(`%${filters.reg_no}%`);
      }

      if (filters.department) {
        paramCount++;
        queryText += ` AND s.department = $${paramCount}`;
        values.push(filters.department);
      }

      if (filters.year_of_study) {
        paramCount++;
        queryText += ` AND s.year_of_study = $${paramCount}`;
        values.push(filters.year_of_study);
      }

      if (filters.category) {
        paramCount++;
        queryText += ` AND s.category = $${paramCount}`;
        values.push(filters.category);
      }

      queryText += ' ORDER BY s.name';

      const result = await query(queryText, values);
      return result.rows;
    } catch (error) {
      console.error('Error searching students:', error.message);
      throw error;
    }
  }
}

module.exports = new StudentModel();