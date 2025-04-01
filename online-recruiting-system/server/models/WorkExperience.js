const pool = require('../config/db');

const WorkExperience = {
  // Get all work experience records for a user
  getByUserId: async (userId) => {
    const result = await pool.query(
      'SELECT * FROM work_experience WHERE user_id = $1 ORDER BY CASE WHEN current_job = true THEN 0 ELSE 1 END, start_date DESC',
      [userId]
    );
    return result.rows;
  },

  // Get work experience by ID
  getById: async (id) => {
    const result = await pool.query(
      'SELECT * FROM work_experience WHERE experience_id = $1',
      [id]
    );
    return result.rows[0];
  },

  // Create a new work experience record
  create: async (experienceData) => {
    const { 
      userId, 
      jobTitle, 
      company, 
      industry, 
      startDate, 
      endDate, 
      currentJob, 
      responsibilities, 
      skills 
    } = experienceData;
    
    // If current job is true, set end_date to null
    const finalEndDate = currentJob ? null : endDate;
    
    const result = await pool.query(
      `INSERT INTO work_experience 
       (user_id, job_title, company, industry, start_date, end_date, current_job, responsibilities, skills) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [userId, jobTitle, company, industry, startDate, finalEndDate, currentJob, responsibilities, skills]
    );
    
    return result.rows[0];
  },

  // Update work experience record
  update: async (id, updates) => {
    // Special handling for current_job update
    if (updates.currentJob === true && !('endDate' in updates)) {
      updates.endDate = null;
    }
    
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
      `UPDATE work_experience SET ${fields.join(', ')} WHERE experience_id = $${paramIndex} RETURNING *`,
      values
    );
    
    return result.rows[0];
  },

  // Delete work experience record
  delete: async (id) => {
    const result = await pool.query(
      'DELETE FROM work_experience WHERE experience_id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  },

  // Check if work experience record belongs to user
  belongsToUser: async (experienceId, userId) => {
    const result = await pool.query(
      'SELECT EXISTS(SELECT 1 FROM work_experience WHERE experience_id = $1 AND user_id = $2)',
      [experienceId, userId]
    );
    return result.rows[0].exists;
  },

  // Get total years of experience for a user
  getTotalYearsOfExperience: async (userId) => {
    const result = await pool.query(
      `SELECT 
        SUM(
          CASE 
            WHEN current_job = true THEN 
              EXTRACT(YEAR FROM AGE(NOW(), start_date)) + 
              EXTRACT(MONTH FROM AGE(NOW(), start_date))/12
            ELSE 
              EXTRACT(YEAR FROM AGE(end_date, start_date)) + 
              EXTRACT(MONTH FROM AGE(end_date, start_date))/12
          END
        ) as total_years
      FROM work_experience 
      WHERE user_id = $1`,
      [userId]
    );
    return result.rows[0].total_years || 0;
  }
};

module.exports = WorkExperience;