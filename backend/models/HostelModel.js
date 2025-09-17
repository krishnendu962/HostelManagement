const BaseModel = require('./BaseModel');
const { query } = require('../config/database');

class HostelModel extends BaseModel {
  constructor() {
    super('hostels');
  }

  // Find hostels by type (Boys/Girls)
  async findByType(hostelType) {
    try {
      const queryText = 'SELECT * FROM hostels WHERE hostel_type = $1 ORDER BY hostel_name';
      const result = await query(queryText, [hostelType]);
      return result.rows;
    } catch (error) {
      console.error('Error finding hostels by type:', error.message);
      throw error;
    }
  }

  // Get hostel with warden details
  async findWithWarden(hostelId) {
    try {
      const queryText = `
        SELECT 
          h.*,
          u.username as warden_username,
          u.email as warden_email,
          u.phone as warden_phone
        FROM hostels h
        LEFT JOIN users u ON h.warden_id = u.user_id
        WHERE h.hostel_id = $1
      `;
      const result = await query(queryText, [hostelId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding hostel with warden:', error.message);
      throw error;
    }
  }

  // Get hostel occupancy statistics
  async getOccupancyStats(hostelId) {
    try {
      const queryText = `
        SELECT 
          h.hostel_name,
          h.total_rooms,
          h.hostel_type,
          COUNT(r.room_id) as total_room_count,
          COUNT(CASE WHEN r.status = 'Vacant' THEN 1 END) as vacant_rooms,
          COUNT(CASE WHEN r.status = 'Occupied' THEN 1 END) as occupied_rooms,
          COUNT(CASE WHEN r.status = 'Under Maintenance' THEN 1 END) as maintenance_rooms,
          SUM(r.capacity) as total_capacity,
          COUNT(ra.allotment_id) as current_students
        FROM hostels h
        LEFT JOIN rooms r ON h.hostel_id = r.hostel_id
        LEFT JOIN room_allotments ra ON r.room_id = ra.room_id AND ra.status = 'Active'
        WHERE h.hostel_id = $1
        GROUP BY h.hostel_id, h.hostel_name, h.total_rooms, h.hostel_type
      `;
      const result = await query(queryText, [hostelId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting hostel occupancy stats:', error.message);
      throw error;
    }
  }

  // Get all hostels with basic statistics
  async findAllWithStats() {
    try {
      const queryText = `
        SELECT 
          h.*,
          u.username as warden_username,
          COUNT(r.room_id) as room_count,
          COUNT(CASE WHEN r.status = 'Vacant' THEN 1 END) as vacant_rooms,
          COUNT(CASE WHEN r.status = 'Occupied' THEN 1 END) as occupied_rooms,
          COUNT(ra.allotment_id) as current_students
        FROM hostels h
        LEFT JOIN users u ON h.warden_id = u.user_id
        LEFT JOIN rooms r ON h.hostel_id = r.hostel_id
        LEFT JOIN room_allotments ra ON r.room_id = ra.room_id AND ra.status = 'Active'
        GROUP BY h.hostel_id, h.hostel_name, h.hostel_type, h.warden_id, h.total_rooms, h.location, u.username
        ORDER BY h.hostel_name
      `;
      const result = await query(queryText);
      return result.rows;
    } catch (error) {
      console.error('Error finding hostels with stats:', error.message);
      throw error;
    }
  }

  // Update room count when rooms are added/removed
  async updateRoomCount(hostelId) {
    try {
      const queryText = `
        UPDATE hostels 
        SET total_rooms = (
          SELECT COUNT(*) FROM rooms WHERE hostel_id = $1
        )
        WHERE hostel_id = $1
        RETURNING *
      `;
      const result = await query(queryText, [hostelId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error updating room count:', error.message);
      throw error;
    }
  }

  // Find hostels managed by a specific warden
  async findByWarden(wardenId) {
    try {
      const queryText = `
        SELECT h.*, COUNT(r.room_id) as room_count
        FROM hostels h
        LEFT JOIN rooms r ON h.hostel_id = r.hostel_id
        WHERE h.warden_id = $1
        GROUP BY h.hostel_id
        ORDER BY h.hostel_name
      `;
      const result = await query(queryText, [wardenId]);
      return result.rows;
    } catch (error) {
      console.error('Error finding hostels by warden:', error.message);
      throw error;
    }
  }
}

module.exports = new HostelModel();