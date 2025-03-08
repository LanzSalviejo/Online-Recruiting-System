const pool = require('../config/db');

const Education = {
  // Find all education records for a user
  findByUserId: async (userId) => {
    const result = await pool.query(
      'SELECT * FROM education WHERE user_id = $1 ORDER BY start_date DESC',
      [userId]
    );
    return result.rows;
  },

  // Find education by ID
  findById: async (id) => {
    const result = await pool.query(
      'SELECT * FROM education WHERE education_id = $1',
      [id]
    );
    return result.rows[0];
  },

  // Create a new education record
  create: async (educationData) => {
    const { 
      userId, 
      degreeLevel, 
      fieldOfStudy, 
      institution, 
      startDate, 
      endDate, 
      gpa 
    } = educationData;
    
    const result = await pool.query(
      `INSERT INTO education 
       (user_id, degree_level, field_of_study, institution, start_date, end_date, gpa) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [userId, degreeLevel, fieldOfStudy, institution, startDate, endDate, gpa]
    );
    
    return result.rows[0];
  },

  // Update education record
  update: async (id, updates) => {
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
    
    values.push(id);
    
    const result = await pool.query(
      `UPDATE education SET ${fields.join(', ')} WHERE education_id = $${paramIndex} RETURNING *`,
      values
    );
    
    return result.rows[0];
  },

  // Delete education record
  delete: async (id) => {
    const result = await pool.query(
      'DELETE FROM education WHERE education_id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  },

  // Check if education record belongs to user
  belongsToUser: async (educationId, userId) => {
    const result = await pool.query(
      'SELECT EXISTS(SELECT 1 FROM education WHERE education_id = $1 AND user_id = $2)',
      [educationId, userId]
    );
    return result.rows[0].exists;
  }
};

module.exports = Education;