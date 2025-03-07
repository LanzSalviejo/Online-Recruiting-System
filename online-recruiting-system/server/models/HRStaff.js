const pool = require('../config/db');

const HRStaff = {
  // Create a new HR staff profile
  create: async (hrData) => {
    const { userId, workingId, phoneNumber } = hrData;
    
    const result = await pool.query(
      'INSERT INTO hr_staff (user_id, working_id, phone_number) VALUES ($1, $2, $3) RETURNING *',
      [userId, workingId, phoneNumber]
    );
    
    return result.rows[0];
  },

  // Find HR staff by user ID
  findByUserId: async (userId) => {
    const result = await pool.query(
      'SELECT * FROM hr_staff WHERE user_id = $1',
      [userId]
    );
    
    return result.rows[0];
  },

  // Update HR staff profile
  update: async (userId, updates) => {
    const fields = [];
    const values = [];
    let paramIndex = 1;
    
    // Build dynamic query based on provided updates
    for (const [key, value] of Object.entries(updates)) {
      // Convert camelCase to snake_case for SQL
      const snakeCaseKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      fields.push(`${snakeCaseKey} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
    
    values.push(userId);
    
    const result = await pool.query(
      `UPDATE hr_staff SET ${fields.join(', ')} WHERE user_id = $${paramIndex} RETURNING *`,
      values
    );
    
    return result.rows[0];
  },

  // Approve HR staff
  approve: async (userId) => {
    const result = await pool.query(
      'UPDATE hr_staff SET is_approved = TRUE WHERE user_id = $1 RETURNING *',
      [userId]
    );
    
    return result.rows[0];
  }
};

module.exports = HRStaff;