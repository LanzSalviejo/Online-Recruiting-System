const pool = require('../config/db');

const JobPreference = {
  // Find all job preferences for a user
  findByUserId: async (userId) => {
    const result = await pool.query(
      'SELECT * FROM job_preferences WHERE user_id = $1',
      [userId]
    );
    return result.rows;
  },

  // Find job preference by ID
  findById: async (id) => {
    const result = await pool.query(
      'SELECT * FROM job_preferences WHERE preference_id = $1',
      [id]
    );
    return result.rows[0];
  },

  // Create a new job preference
  create: async (preferenceData) => {
    const { 
      userId, 
      positionType, 
      category, 
      location, 
      minSalary, 
      keywords 
    } = preferenceData;
    
    const result = await pool.query(
      `INSERT INTO job_preferences 
       (user_id, position_type, category, location, min_salary, keywords) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [userId, positionType, category, location, minSalary, keywords]
    );
    
    return result.rows[0];
  },

  // Update job preference
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
      `UPDATE job_preferences SET ${fields.join(', ')} WHERE preference_id = $${paramIndex} RETURNING *`,
      values
    );
    
    return result.rows[0];
  },

  // Delete job preference
  delete: async (id) => {
    const result = await pool.query(
      'DELETE FROM job_preferences WHERE preference_id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  },

  // Check if job preference belongs to user
  belongsToUser: async (preferenceId, userId) => {
    const result = await pool.query(
      'SELECT EXISTS(SELECT 1 FROM job_preferences WHERE preference_id = $1 AND user_id = $2)',
      [preferenceId, userId]
    );
    return result.rows[0].exists;
  },

  // Find users with matching job preferences for a job posting
  findMatchingUsers: async (jobData) => {
    const { category, positionType, location, salary } = jobData;
    
    // Match users whose preferences match this job
    // Using a scoring system where exact matches get higher scores
    const result = await pool.query(
      `SELECT 
        jp.user_id,
        SUM(
          CASE WHEN jp.category = $1 THEN 1.0 ELSE 0.5 END +
          CASE WHEN jp.position_type = $2 THEN 1.0 ELSE 0.0 END +
          CASE WHEN jp.location = $3 THEN 1.0 ELSE 0.5 END +
          CASE WHEN $4 >= jp.min_salary THEN 1.0 ELSE 0.0 END
        ) as match_score
      FROM 
        job_preferences jp
      JOIN 
        users u ON jp.user_id = u.id
      WHERE 
        u.is_active = true AND 
        u.account_type = 'applicant'
      GROUP BY 
        jp.user_id
      HAVING 
        SUM(
          CASE WHEN jp.category = $1 THEN 1.0 ELSE 0.5 END +
          CASE WHEN jp.position_type = $2 THEN 1.0 ELSE 0.0 END +
          CASE WHEN jp.location = $3 THEN 1.0 ELSE 0.5 END +
          CASE WHEN $4 >= jp.min_salary THEN 1.0 ELSE 0.0 END
        ) >= 2.0
      ORDER BY 
        match_score DESC`,
      [category, positionType, location, salary]
    );
    
    return result.rows;
  }
};

module.exports = JobPreference;