const BaseModel = require('./BaseModel');
const { query } = require('../config/database');

class MaintenanceRequestModel extends BaseModel {
  constructor() {
    super('maintenance_requests');
  }

  // Create maintenance request with auto-assignment logic
  async createRequest(requestData) {
    try {
      // Auto-assign high priority requests to default maintenance staff
      if (requestData.priority === 'High' && !requestData.assigned_to) {
        requestData.assigned_to = 'Maintenance Team';
        requestData.status = 'In Progress';
      }

      const result = await super.create(requestData);
      return result;
    } catch (error) {
      console.error('Error creating maintenance request:', error.message);
      throw error;
    }
  }

  // Find requests by student
  async findByStudent(studentId) {
    try {
      const queryText = `
        SELECT 
          mr.*,
          r.room_no,
          h.hostel_name,
          h.hostel_type
        FROM maintenance_requests mr
        JOIN rooms r ON mr.room_id = r.room_id
        JOIN hostels h ON r.hostel_id = h.hostel_id
        WHERE mr.student_id = $1
        ORDER BY mr.created_at DESC
      `;
      const result = await query(queryText, [studentId]);
      return result.rows;
    } catch (error) {
      console.error('Error finding requests by student:', error.message);
      throw error;
    }
  }

  // Find requests by room
  async findByRoom(roomId) {
    try {
      const queryText = `
        SELECT 
          mr.*,
          s.name as student_name,
          s.reg_no,
          r.room_no,
          h.hostel_name
        FROM maintenance_requests mr
        JOIN students s ON mr.student_id = s.student_id
        JOIN rooms r ON mr.room_id = r.room_id
        JOIN hostels h ON r.hostel_id = h.hostel_id
        WHERE mr.room_id = $1
        ORDER BY mr.created_at DESC
      `;
      const result = await query(queryText, [roomId]);
      return result.rows;
    } catch (error) {
      console.error('Error finding requests by room:', error.message);
      throw error;
    }
  }

  // Find requests by hostel
  async findByHostel(hostelId) {
    try {
      const queryText = `
        SELECT 
          mr.*,
          s.name as student_name,
          s.reg_no,
          r.room_no,
          h.hostel_name
        FROM maintenance_requests mr
        JOIN students s ON mr.student_id = s.student_id
        JOIN rooms r ON mr.room_id = r.room_id
        JOIN hostels h ON r.hostel_id = h.hostel_id
        WHERE h.hostel_id = $1
        ORDER BY mr.priority DESC, mr.created_at ASC
      `;
      const result = await query(queryText, [hostelId]);
      return result.rows;
    } catch (error) {
      console.error('Error finding requests by hostel:', error.message);
      throw error;
    }
  }

  // Find requests by status
  async findByStatus(status) {
    try {
      const queryText = `
        SELECT 
          mr.*,
          s.name as student_name,
          s.reg_no,
          r.room_no,
          h.hostel_name,
          h.hostel_type
        FROM maintenance_requests mr
        JOIN students s ON mr.student_id = s.student_id
        JOIN rooms r ON mr.room_id = r.room_id
        JOIN hostels h ON r.hostel_id = h.hostel_id
        WHERE mr.status = $1
        ORDER BY 
          CASE mr.priority 
            WHEN 'High' THEN 1 
            WHEN 'Medium' THEN 2 
            WHEN 'Low' THEN 3 
          END,
          mr.created_at ASC
      `;
      const result = await query(queryText, [status]);
      return result.rows;
    } catch (error) {
      console.error('Error finding requests by status:', error.message);
      throw error;
    }
  }

  // Find requests by category
  async findByCategory(category) {
    try {
      const queryText = `
        SELECT 
          mr.*,
          s.name as student_name,
          s.reg_no,
          r.room_no,
          h.hostel_name,
          h.hostel_type
        FROM maintenance_requests mr
        JOIN students s ON mr.student_id = s.student_id
        JOIN rooms r ON mr.room_id = r.room_id
        JOIN hostels h ON r.hostel_id = h.hostel_id
        WHERE mr.category = $1
        ORDER BY mr.priority DESC, mr.created_at ASC
      `;
      const result = await query(queryText, [category]);
      return result.rows;
    } catch (error) {
      console.error('Error finding requests by category:', error.message);
      throw error;
    }
  }

  // Get pending requests (for dashboard)
  async findPending() {
    try {
      const queryText = `
        SELECT 
          mr.*,
          s.name as student_name,
          s.reg_no,
          r.room_no,
          h.hostel_name,
          h.hostel_type
        FROM maintenance_requests mr
        JOIN students s ON mr.student_id = s.student_id
        JOIN rooms r ON mr.room_id = r.room_id
        JOIN hostels h ON r.hostel_id = h.hostel_id
        WHERE mr.status = 'Pending'
        ORDER BY 
          CASE mr.priority 
            WHEN 'High' THEN 1 
            WHEN 'Medium' THEN 2 
            WHEN 'Low' THEN 3 
          END,
          mr.created_at ASC
      `;
      const result = await query(queryText);
      return result.rows;
    } catch (error) {
      console.error('Error finding pending requests:', error.message);
      throw error;
    }
  }

  // Update request status
  async updateStatus(requestId, status, assignedTo = null) {
    try {
      let updateData = { 
        status, 
        updated_at: new Date() 
      };
      
      if (assignedTo) {
        updateData.assigned_to = assignedTo;
      }

      const result = await this.update(requestId, updateData, 'request_id');
      return result;
    } catch (error) {
      console.error('Error updating request status:', error.message);
      throw error;
    }
  }

  // Assign request to maintenance staff
  async assignRequest(requestId, assignedTo) {
    try {
      const updateData = {
        assigned_to: assignedTo,
        status: 'In Progress',
        updated_at: new Date()
      };

      const result = await this.update(requestId, updateData, 'request_id');
      return result;
    } catch (error) {
      console.error('Error assigning request:', error.message);
      throw error;
    }
  }

  // Complete maintenance request
  async completeRequest(requestId) {
    try {
      const updateData = {
        status: 'Completed',
        updated_at: new Date()
      };

      const result = await this.update(requestId, updateData, 'request_id');
      return result;
    } catch (error) {
      console.error('Error completing request:', error.message);
      throw error;
    }
  }

  // Get maintenance statistics
  async getStatistics() {
    try {
      const queryText = `
        SELECT 
          COUNT(*) as total_requests,
          COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending_requests,
          COUNT(CASE WHEN status = 'In Progress' THEN 1 END) as in_progress_requests,
          COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed_requests,
          COUNT(CASE WHEN priority = 'High' THEN 1 END) as high_priority,
          COUNT(CASE WHEN priority = 'Medium' THEN 1 END) as medium_priority,
          COUNT(CASE WHEN priority = 'Low' THEN 1 END) as low_priority,
          COUNT(CASE WHEN category = 'Electricity' THEN 1 END) as electricity_requests,
          COUNT(CASE WHEN category = 'Plumbing' THEN 1 END) as plumbing_requests,
          COUNT(CASE WHEN category = 'Cleaning' THEN 1 END) as cleaning_requests,
          COUNT(CASE WHEN category = 'Other' THEN 1 END) as other_requests
        FROM maintenance_requests
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      `;
      const result = await query(queryText);
      return result.rows[0];
    } catch (error) {
      console.error('Error getting maintenance statistics:', error.message);
      throw error;
    }
  }

  // Search requests with filters
  async search(filters = {}) {
    try {
      let queryText = `
        SELECT 
          mr.*,
          s.name as student_name,
          s.reg_no,
          r.room_no,
          h.hostel_name,
          h.hostel_type
        FROM maintenance_requests mr
        JOIN students s ON mr.student_id = s.student_id
        JOIN rooms r ON mr.room_id = r.room_id
        JOIN hostels h ON r.hostel_id = h.hostel_id
        WHERE 1=1
      `;
      
      const values = [];
      let paramCount = 0;

      if (filters.status) {
        paramCount++;
        queryText += ` AND mr.status = $${paramCount}`;
        values.push(filters.status);
      }

      if (filters.category) {
        paramCount++;
        queryText += ` AND mr.category = $${paramCount}`;
        values.push(filters.category);
      }

      if (filters.priority) {
        paramCount++;
        queryText += ` AND mr.priority = $${paramCount}`;
        values.push(filters.priority);
      }

      if (filters.hostel_id) {
        paramCount++;
        queryText += ` AND h.hostel_id = $${paramCount}`;
        values.push(filters.hostel_id);
      }

      if (filters.assigned_to) {
        paramCount++;
        queryText += ` AND mr.assigned_to ILIKE $${paramCount}`;
        values.push(`%${filters.assigned_to}%`);
      }

      if (filters.date_from) {
        paramCount++;
        queryText += ` AND mr.created_at >= $${paramCount}`;
        values.push(filters.date_from);
      }

      if (filters.date_to) {
        paramCount++;
        queryText += ` AND mr.created_at <= $${paramCount}`;
        values.push(filters.date_to);
      }

      queryText += `
        ORDER BY 
          CASE mr.priority 
            WHEN 'High' THEN 1 
            WHEN 'Medium' THEN 2 
            WHEN 'Low' THEN 3 
          END,
          mr.created_at DESC
      `;

      const result = await query(queryText, values);
      return result.rows;
    } catch (error) {
      console.error('Error searching maintenance requests:', error.message);
      throw error;
    }
  }

  // Get overdue requests (pending for more than 7 days)
  async findOverdue() {
    try {
      const queryText = `
        SELECT 
          mr.*,
          s.name as student_name,
          s.reg_no,
          r.room_no,
          h.hostel_name,
          h.hostel_type,
          (CURRENT_DATE - mr.created_at::date) as days_pending
        FROM maintenance_requests mr
        JOIN students s ON mr.student_id = s.student_id
        JOIN rooms r ON mr.room_id = r.room_id
        JOIN hostels h ON r.hostel_id = h.hostel_id
        WHERE mr.status IN ('Pending', 'In Progress') 
          AND mr.created_at < CURRENT_DATE - INTERVAL '7 days'
        ORDER BY mr.created_at ASC
      `;
      const result = await query(queryText);
      return result.rows;
    } catch (error) {
      console.error('Error finding overdue requests:', error.message);
      throw error;
    }
  }
}

module.exports = new MaintenanceRequestModel();