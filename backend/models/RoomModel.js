const BaseModel = require('./BaseModel');
const { query } = require('../config/database');

class RoomModel extends BaseModel {
  constructor() {
    super('rooms');
  }

  // Find rooms by hostel
  async findByHostel(hostelId) {
    try {
      const queryText = `
        SELECT 
          r.*,
          h.hostel_name,
          h.hostel_type,
          COUNT(ra.allotment_id) as current_occupants
        FROM rooms r
        JOIN hostels h ON r.hostel_id = h.hostel_id
        LEFT JOIN room_allotments ra ON r.room_id = ra.room_id AND ra.status = 'Active'
        WHERE r.hostel_id = $1
        GROUP BY r.room_id, h.hostel_name, h.hostel_type
        ORDER BY r.room_no
      `;
      const result = await query(queryText, [hostelId]);
      return result.rows;
    } catch (error) {
      console.error('Error finding rooms by hostel:', error.message);
      throw error;
    }
  }

  // Find vacant rooms
  async findVacant() {
    try {
      const queryText = `
        SELECT 
          r.*,
          h.hostel_name,
          h.hostel_type,
          COUNT(ra.allotment_id) as current_occupants
        FROM rooms r
        JOIN hostels h ON r.hostel_id = h.hostel_id
        LEFT JOIN room_allotments ra ON r.room_id = ra.room_id AND ra.status = 'Active'
        WHERE r.status = 'Vacant'
        GROUP BY r.room_id, h.hostel_name, h.hostel_type
        HAVING COUNT(ra.allotment_id) < r.capacity
        ORDER BY h.hostel_name, r.room_no
      `;
      const result = await query(queryText);
      return result.rows;
    } catch (error) {
      console.error('Error finding vacant rooms:', error.message);
      throw error;
    }
  }

  // Find available rooms (vacant with space)
  async findAvailable(hostelType = null) {
    try {
      let queryText = `
        SELECT 
          r.*,
          h.hostel_name,
          h.hostel_type,
          COUNT(ra.allotment_id) as current_occupants,
          (r.capacity - COUNT(ra.allotment_id)) as available_spots
        FROM rooms r
        JOIN hostels h ON r.hostel_id = h.hostel_id
        LEFT JOIN room_allotments ra ON r.room_id = ra.room_id AND ra.status = 'Active'
        WHERE r.status = 'Vacant'
      `;
      
      const values = [];
      if (hostelType) {
        queryText += ` AND h.hostel_type = $1`;
        values.push(hostelType);
      }

      queryText += `
        GROUP BY r.room_id, h.hostel_name, h.hostel_type
        HAVING COUNT(ra.allotment_id) < r.capacity
        ORDER BY h.hostel_name, r.room_no
      `;

      const result = await query(queryText, values);
      return result.rows;
    } catch (error) {
      console.error('Error finding available rooms:', error.message);
      throw error;
    }
  }

  // Get room with current occupants
  async findWithOccupants(roomId) {
    try {
      const queryText = `
        SELECT 
          r.*,
          h.hostel_name,
          h.hostel_type,
          h.location,
          json_agg(
            CASE WHEN s.student_id IS NOT NULL THEN
              json_build_object(
                'student_id', s.student_id,
                'name', s.name,
                'reg_no', s.reg_no,
                'year_of_study', s.year_of_study,
                'department', s.department,
                'allotment_date', ra.allotment_date
              )
            END
          ) FILTER (WHERE s.student_id IS NOT NULL) as occupants
        FROM rooms r
        JOIN hostels h ON r.hostel_id = h.hostel_id
        LEFT JOIN room_allotments ra ON r.room_id = ra.room_id AND ra.status = 'Active'
        LEFT JOIN students s ON ra.student_id = s.student_id
        WHERE r.room_id = $1
        GROUP BY r.room_id, h.hostel_name, h.hostel_type, h.location
      `;
      const result = await query(queryText, [roomId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding room with occupants:', error.message);
      throw error;
    }
  }

  // Check if room has space for new student
  async hasAvailableSpace(roomId) {
    try {
      const queryText = `
        SELECT 
          r.capacity,
          COUNT(ra.allotment_id) as current_occupants,
          (r.capacity - COUNT(ra.allotment_id)) as available_spots
        FROM rooms r
        LEFT JOIN room_allotments ra ON r.room_id = ra.room_id AND ra.status = 'Active'
        WHERE r.room_id = $1 AND r.status = 'Vacant'
        GROUP BY r.room_id, r.capacity
      `;
      const result = await query(queryText, [roomId]);
      const room = result.rows[0];
      return room && room.available_spots > 0;
    } catch (error) {
      console.error('Error checking room availability:', error.message);
      throw error;
    }
  }

  // Update room status based on occupancy
  async updateStatusByOccupancy(roomId) {
    try {
      const queryText = `
        UPDATE rooms 
        SET status = CASE 
          WHEN (
            SELECT COUNT(*) 
            FROM room_allotments 
            WHERE room_id = $1 AND status = 'Active'
          ) >= capacity THEN 'Occupied'
          ELSE 'Vacant'
        END
        WHERE room_id = $1 AND status != 'Under Maintenance'
        RETURNING *
      `;
      const result = await query(queryText, [roomId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error updating room status:', error.message);
      throw error;
    }
  }

  // Find rooms by status
  async findByStatus(status) {
    try {
      const queryText = `
        SELECT 
          r.*,
          h.hostel_name,
          h.hostel_type,
          COUNT(ra.allotment_id) as current_occupants
        FROM rooms r
        JOIN hostels h ON r.hostel_id = h.hostel_id
        LEFT JOIN room_allotments ra ON r.room_id = ra.room_id AND ra.status = 'Active'
        WHERE r.status = $1
        GROUP BY r.room_id, h.hostel_name, h.hostel_type
        ORDER BY h.hostel_name, r.room_no
      `;
      const result = await query(queryText, [status]);
      return result.rows;
    } catch (error) {
      console.error('Error finding rooms by status:', error.message);
      throw error;
    }
  }

  // Search rooms with filters
  async search(filters = {}) {
    try {
      let queryText = `
        SELECT 
          r.*,
          h.hostel_name,
          h.hostel_type,
          COUNT(ra.allotment_id) as current_occupants,
          (r.capacity - COUNT(ra.allotment_id)) as available_spots
        FROM rooms r
        JOIN hostels h ON r.hostel_id = h.hostel_id
        LEFT JOIN room_allotments ra ON r.room_id = ra.room_id AND ra.status = 'Active'
        WHERE 1=1
      `;
      
      const values = [];
      let paramCount = 0;

      if (filters.hostel_id) {
        paramCount++;
        queryText += ` AND r.hostel_id = $${paramCount}`;
        values.push(filters.hostel_id);
      }

      if (filters.status) {
        paramCount++;
        queryText += ` AND r.status = $${paramCount}`;
        values.push(filters.status);
      }

      if (filters.hostel_type) {
        paramCount++;
        queryText += ` AND h.hostel_type = $${paramCount}`;
        values.push(filters.hostel_type);
      }

      if (filters.room_no) {
        paramCount++;
        queryText += ` AND r.room_no ILIKE $${paramCount}`;
        values.push(`%${filters.room_no}%`);
      }

      queryText += `
        GROUP BY r.room_id, h.hostel_name, h.hostel_type
        ORDER BY h.hostel_name, r.room_no
      `;

      const result = await query(queryText, values);
      return result.rows;
    } catch (error) {
      console.error('Error searching rooms:', error.message);
      throw error;
    }
  }
}

module.exports = new RoomModel();