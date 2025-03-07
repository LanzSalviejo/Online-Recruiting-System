const pool = require('../config/db');

const Applicant = {
  // Create a new applicant profile
  create: async (applicantData) => {
    const { userId, phoneNumber, dateOfBirth, street, city, postalCode } = applicantData;
    
    const result = await pool.query(
      'INSERT INTO applicants (user_id, phone_number, date_of_birth, street, city, postal_code) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [userId, phoneNumber, dateOfBirth, street, city, postalCode]
    );
    
    return result.rows[0];
  },

  // Find applicant by user ID
  findByUserId: async (userId) => {
    const result = await pool.query(
      'SELECT * FROM applicants WHERE user_id = $1',
      [userId]
    );
    
    return result.rows[0];
  },

  // Update applicant profile
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
      `UPDATE applicants SET ${fields.join(', ')} WHERE user_id = $${paramIndex} RETURNING *`,
      values
    );
    
    return result.rows[0];
  }
};

module.exports = Applicant;