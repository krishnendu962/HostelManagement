const BaseModel = require('./BaseModel');
const { supabase } = require('../config/supabase');

class WardenModel extends BaseModel {
  constructor() {
    super('users'); // wardens are stored in users table with role = 'Warden'
  }

  // Find warden record by associated user_id
  async findByUserId(userId) {
    try {
      const { data, error } = await supabase.from('users').select('*').eq('user_id', userId).eq('role', 'Warden').maybeSingle();
      if (error) throw error;
      return data || null;
    } catch (error) {
      console.error('Error finding warden by user_id:', error.message);
      throw error;
    }
  }

  // List all wardens
  async findAllWardens() {
    try {
      const { data, error } = await supabase.from('users').select('user_id, username, email, phone, created_at').eq('role', 'Warden').order('username', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching all wardens:', error.message);
      throw error;
    }
  }

  // Find warden along with hostels they manage
  async findWithHostels(userId) {
    try {
      const { data, error } = await supabase.from('users').select('user_id, username, email, phone, hostels(*)').eq('user_id', userId).eq('role', 'Warden').maybeSingle();
      if (error) throw error;
      return data || null;
    } catch (error) {
      console.error('Error finding warden with hostels:', error.message);
      throw error;
    }
  }

  // Assign a warden (user_id) to a hostel
  async assignToHostel(userId, hostelId) {
    try {
      const { data, error } = await supabase.from('hostels').update({ warden_id: userId }).eq('hostel_id', hostelId).select().maybeSingle();
      if (error) throw error;
      return data || null;
    } catch (error) {
      console.error('Error assigning warden to hostel:', error.message);
      throw error;
    }
  }

  // Unassign warden from a hostel (set warden_id to null)
  async unassignFromHostel(hostelId) {
    try {
      const { data, error } = await supabase.from('hostels').update({ warden_id: null }).eq('hostel_id', hostelId).select().maybeSingle();
      if (error) throw error;
      return data || null;
    } catch (error) {
      console.error('Error unassigning warden from hostel:', error.message);
      throw error;
    }
  }
}

module.exports = new WardenModel();
