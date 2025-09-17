const BaseModel = require('./BaseModel');
const { query, getClient } = require('../config/database');

class RoomAllotmentModel extends BaseModel {
  constructor() {
    super('room_allotments');
  }

  // Create room allotment with transaction
  async createAllotment(studentId, roomId) {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      // Check if room has available space
      const roomCheck = await client.query(`
        SELECT 
          r.capacity,
          COUNT(ra.allotment_id) as current_occupants,
          r.status
        FROM rooms r
        LEFT JOIN room_allotments ra ON r.room_id = ra.room_id AND ra.status = 'Active'
        WHERE r.room_id = $1
        GROUP BY r.room_id, r.capacity, r.status
      `, [roomId]);

      if (!roomCheck.rows[0]) {
        throw new Error('Room not found');
      }

      const room = roomCheck.rows[0];
      if (room.status === 'Under Maintenance') {
        throw new Error('Room is under maintenance');
      }

      if (room.current_occupants >= room.capacity) {
        throw new Error('Room is full');
      }

      // Check if student already has an active allotment
      const studentCheck = await client.query(`
        SELECT allotment_id FROM room_allotments 
        WHERE student_id = $1 AND status = 'Active'
      `, [studentId]);

      if (studentCheck.rows.length > 0) {
        throw new Error('Student already has an active room allotment');
      }

      // Create the allotment
      const allotmentResult = await client.query(`
        INSERT INTO room_allotments (student_id, room_id, allotment_date, status)
        VALUES ($1, $2, CURRENT_DATE, 'Active')
        RETURNING *
      `, [studentId, roomId]);

      // Update room status if it becomes full
      const newOccupants = parseInt(room.current_occupants) + 1;
      if (newOccupants >= room.capacity) {
        await client.query(`
          UPDATE rooms SET status = 'Occupied' WHERE room_id = $1
        `, [roomId]);
      }

      await client.query('COMMIT');
      return allotmentResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating allotment:', error.message);
      throw error;
    } finally {
      client.release();
    }
  }

  // Vacate room with transaction
  async vacateRoom(allotmentId, vacatedDate = null) {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      // Get allotment details
      const allotmentResult = await client.query(`
        SELECT * FROM room_allotments WHERE allotment_id = $1 AND status = 'Active'
      `, [allotmentId]);

      if (!allotmentResult.rows[0]) {
        throw new Error('Active allotment not found');
      }

      const allotment = allotmentResult.rows[0];

      // Update allotment status
      const updateResult = await client.query(`
        UPDATE room_allotments 
        SET status = 'Vacated', vacated_date = $1
        WHERE allotment_id = $2
        RETURNING *
      `, [vacatedDate || new Date(), allotmentId]);

      // Update room status to vacant if it was occupied
      await client.query(`
        UPDATE rooms 
        SET status = CASE 
          WHEN (
            SELECT COUNT(*) 
            FROM room_allotments 
            WHERE room_id = $1 AND status = 'Active'
          ) = 0 THEN 'Vacant'
          ELSE status
        END
        WHERE room_id = $1 AND status = 'Occupied'
      `, [allotment.room_id]);

      await client.query('COMMIT');
      return updateResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error vacating room:', error.message);
      throw error;
    } finally {
      client.release();
    }
  }

  // Get allotment with full details
  async findWithDetails(allotmentId) {
    try {
      const queryText = `
        SELECT 
          ra.*,
          s.name as student_name,
          s.reg_no,
          s.year_of_study,
          s.department,
          r.room_no,
          r.capacity,
          h.hostel_name,
          h.hostel_type,
          h.location
        FROM room_allotments ra
        JOIN students s ON ra.student_id = s.student_id
        JOIN rooms r ON ra.room_id = r.room_id
        JOIN hostels h ON r.hostel_id = h.hostel_id
        WHERE ra.allotment_id = $1
      `;
      const result = await query(queryText, [allotmentId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding allotment with details:', error.message);
      throw error;
    }
  }

  // Get active allotments for a hostel
  async findActiveByHostel(hostelId) {
    try {
      const queryText = `
        SELECT 
          ra.*,
          s.name as student_name,
          s.reg_no,
          s.year_of_study,
          s.department,
          r.room_no,
          r.capacity
        FROM room_allotments ra
        JOIN students s ON ra.student_id = s.student_id
        JOIN rooms r ON ra.room_id = r.room_id
        WHERE r.hostel_id = $1 AND ra.status = 'Active'
        ORDER BY r.room_no, s.name
      `;
      const result = await query(queryText, [hostelId]);
      return result.rows;
    } catch (error) {
      console.error('Error finding active allotments by hostel:', error.message);
      throw error;
    }
  }

  // Get active allotment for a student
  async findActiveByStudent(studentId) {
    try {
      const queryText = `
        SELECT 
          ra.*,
          r.room_no,
          r.capacity,
          h.hostel_name,
          h.hostel_type,
          h.location
        FROM room_allotments ra
        JOIN rooms r ON ra.room_id = r.room_id
        JOIN hostels h ON r.hostel_id = h.hostel_id
        WHERE ra.student_id = $1 AND ra.status = 'Active'
      `;
      const result = await query(queryText, [studentId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding active allotment by student:', error.message);
      throw error;
    }
  }

  // Get allotment history for a student
  async findHistoryByStudent(studentId) {
    try {
      const queryText = `
        SELECT 
          ra.*,
          r.room_no,
          h.hostel_name,
          h.hostel_type
        FROM room_allotments ra
        JOIN rooms r ON ra.room_id = r.room_id
        JOIN hostels h ON r.hostel_id = h.hostel_id
        WHERE ra.student_id = $1
        ORDER BY ra.allotment_date DESC
      `;
      const result = await query(queryText, [studentId]);
      return result.rows;
    } catch (error) {
      console.error('Error finding allotment history:', error.message);
      throw error;
    }
  }

  // Get pending allotments
  async findPending() {
    try {
      const queryText = `
        SELECT 
          ra.*,
          s.name as student_name,
          s.reg_no,
          s.year_of_study,
          s.department,
          r.room_no,
          h.hostel_name,
          h.hostel_type
        FROM room_allotments ra
        JOIN students s ON ra.student_id = s.student_id
        JOIN rooms r ON ra.room_id = r.room_id
        JOIN hostels h ON r.hostel_id = h.hostel_id
        WHERE ra.status = 'Pending'
        ORDER BY ra.allotment_date ASC
      `;
      const result = await query(queryText);
      return result.rows;
    } catch (error) {
      console.error('Error finding pending allotments:', error.message);
      throw error;
    }
  }

  // Approve pending allotment
  async approvePending(allotmentId) {
    try {
      const queryText = `
        UPDATE room_allotments 
        SET status = 'Active' 
        WHERE allotment_id = $1 AND status = 'Pending'
        RETURNING *
      `;
      const result = await query(queryText, [allotmentId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error approving allotment:', error.message);
      throw error;
    }
  }

  // Get room occupancy report
  async getOccupancyReport() {
    try {
      const queryText = `
        SELECT 
          h.hostel_name,
          h.hostel_type,
          COUNT(r.room_id) as total_rooms,
          COUNT(CASE WHEN r.status = 'Vacant' THEN 1 END) as vacant_rooms,
          COUNT(CASE WHEN r.status = 'Occupied' THEN 1 END) as occupied_rooms,
          COUNT(CASE WHEN r.status = 'Under Maintenance' THEN 1 END) as maintenance_rooms,
          SUM(r.capacity) as total_capacity,
          COUNT(ra.allotment_id) as current_students,
          ROUND(
            (COUNT(ra.allotment_id)::DECIMAL / NULLIF(SUM(r.capacity), 0)) * 100, 2
          ) as occupancy_percentage
        FROM hostels h
        LEFT JOIN rooms r ON h.hostel_id = r.hostel_id
        LEFT JOIN room_allotments ra ON r.room_id = ra.room_id AND ra.status = 'Active'
        GROUP BY h.hostel_id, h.hostel_name, h.hostel_type
        ORDER BY h.hostel_name
      `;
      const result = await query(queryText);
      return result.rows;
    } catch (error) {
      console.error('Error getting occupancy report:', error.message);
      throw error;
    }
  }
}

module.exports = new RoomAllotmentModel();