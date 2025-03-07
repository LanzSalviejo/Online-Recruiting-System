const pool = require('../config/db');

/**
 * JobPosting model for PostgreSQL
 * Uses Data Access Object (DAO) pattern
 */
const JobPosting = {
  /**
   * Find all job postings with filtering and pagination
   * @param {Object} filters - Filter criteria
   * @param {Number} page - Page number
   * @param {Number} limit - Results per page
   * @returns {Promise<Object>} Jobs with pagination info
   */
  findAll: async (filters = {}, page = 1, limit = 10) => {
    try {
      // Calculate pagination values
      const offset = (page - 1) * limit;
      
      // Start building the query
      let queryText = `
        SELECT j.*, c.name as category_name
        FROM job_postings j
        LEFT JOIN job_categories c ON j.category_id = c.id
        WHERE j.is_active = true AND j.due_date >= CURRENT_DATE
      `;
      
      // Initialize params array for prepared statement
      let params = [];
      let paramCount = 1;
      
      // Add filters to query if they exist
      if (filters.keyword) {
        queryText += ` AND (
          j.title ILIKE $${paramCount} 
          OR j.description ILIKE $${paramCount} 
          OR j.company_name ILIKE $${paramCount}
        )`;
        params.push(`%${filters.keyword}%`);
        paramCount++;
      }
      
      if (filters.location) {
        queryText += ` AND j.location ILIKE $${paramCount}`;
        params.push(`%${filters.location}%`);
        paramCount++;
      }
      
      if (filters.categoryId) {
        queryText += ` AND j.category_id = $${paramCount}`;
        params.push(filters.categoryId);
        paramCount++;
      } else if (filters.category) {
        queryText += ` AND c.name ILIKE $${paramCount}`;
        params.push(`%${filters.category}%`);
        paramCount++;
      }
      
      if (filters.positionType) {
        queryText += ` AND j.position_type = $${paramCount}`;
        params.push(filters.positionType);
        paramCount++;
      }
      
      if (filters.minSalary) {
        queryText += ` AND j.salary >= $${paramCount}`;
        params.push(filters.minSalary);
        paramCount++;
      }
      
      if (filters.dueDate) {
        queryText += ` AND j.due_date >= $${paramCount}`;
        params.push(filters.dueDate);
        paramCount++;
      }
      
      if (filters.creatorId) {
        queryText += ` AND j.creator_id = $${paramCount}`;
        params.push(filters.creatorId);
        paramCount++;
      }
      
      // Count total matching jobs for pagination
      const countQueryText = `
        SELECT COUNT(*) 
        FROM (${queryText}) AS filtered_jobs
      `;
      
      const countResult = await pool.query(countQueryText, params);
      const totalJobs = parseInt(countResult.rows[0].count);
      const totalPages = Math.ceil(totalJobs / limit);
      
      // Add sorting and pagination to the main query
      queryText += ` ORDER BY j.post_date DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
      params.push(limit, offset);
      
      // Execute the query
      const result = await pool.query(queryText, params);
      
      // Format job data for frontend compatibility
      const formattedJobs = result.rows.map(job => {
        // Parse JSON fields if they exist
        const responsibilities = job.responsibilities ? JSON.parse(job.responsibilities) : [];
        const requirements = job.requirements ? JSON.parse(job.requirements) : [];
        
        return {
          _id: job.id,
          title: job.title,
          companyName: job.company_name,
          creatorId: job.creator_id,
          positionType: job.position_type,
          categoryId: job.category_id,
          categoryName: job.category_name,
          location: job.location,
          contactEmail: job.contact_email,
          minEducationLevel: job.min_education_level,
          minExperience: job.min_experience,
          description: job.description,
          responsibilities,
          requirements,
          salary: job.salary,
          postDate: job.post_date,
          dueDate: job.due_date,
          isActive: job.is_active
        };
      });
      
      // Return the results with pagination info
      return {
        jobs: formattedJobs,
        totalJobs,
        totalPages,
        currentPage: page
      };
    } catch (error) {
      console.error('Error in JobPosting.findAll:', error);
      throw error;
    }
  },
  
  /**
   * Find job posting by ID
   * @param {Number} id - Job posting ID
   * @returns {Promise<Object>} Job posting
   */
  findById: async (id) => {
    try {
      const query = `
        SELECT j.*, c.name as category_name
        FROM job_postings j
        LEFT JOIN job_categories c ON j.category_id = c.id
        WHERE j.id = $1
      `;
      
      const result = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const job = result.rows[0];
      
      // Parse JSON fields if they exist
      const responsibilities = job.responsibilities ? JSON.parse(job.responsibilities) : [];
      const requirements = job.requirements ? JSON.parse(job.requirements) : [];
      
      // Format for frontend compatibility
      return {
        _id: job.id,
        title: job.title,
        companyName: job.company_name,
        creatorId: job.creator_id,
        positionType: job.position_type,
        categoryId: job.category_id,
        categoryName: job.category_name,
        location: job.location,
        contactEmail: job.contact_email,
        minEducationLevel: job.min_education_level,
        minExperience: job.min_experience,
        description: job.description,
        responsibilities,
        requirements,
        salary: job.salary,
        postDate: job.post_date,
        dueDate: job.due_date,
        isActive: job.is_active
      };
    } catch (error) {
      console.error('Error in JobPosting.findById:', error);
      throw error;
    }
  },
  
  /**
   * Find featured job postings
   * @param {Number} limit - Number of jobs to return
   * @returns {Promise<Array>} Featured job postings
   */
  findFeatured: async (limit = 6) => {
    try {
      const query = `
        SELECT j.*, c.name as category_name
        FROM job_postings j
        LEFT JOIN job_categories c ON j.category_id = c.id
        WHERE j.is_active = true AND j.due_date >= CURRENT_DATE
        ORDER BY j.post_date DESC
        LIMIT $1
      `;
      
      const result = await pool.query(query, [limit]);
      
      // Format results for frontend compatibility
      return result.rows.map(job => {
        // Parse JSON fields if they exist
        const responsibilities = job.responsibilities ? JSON.parse(job.responsibilities) : [];
        const requirements = job.requirements ? JSON.parse(job.requirements) : [];
        
        return {
          _id: job.id,
          title: job.title,
          companyName: job.company_name,
          positionType: job.position_type,
          categoryId: job.category_id,
          categoryName: job.category_name,
          location: job.location,
          description: job.description,
          responsibilities,
          requirements,
          salary: job.salary,
          postDate: job.post_date,
          dueDate: job.due_date
        };
      });
    } catch (error) {
      console.error('Error in JobPosting.findFeatured:', error);
      throw error;
    }
  },
  
  /**
   * Create a new job posting
   * @param {Object} jobData - Job posting data
   * @returns {Promise<Object>} Created job posting
   */
  create: async (jobData) => {
    try {
      const {
        creatorId,
        title,
        companyName = 'Company Name',
        positionType,
        categoryId,
        location,
        contactEmail,
        minEducationLevel = 'High School',
        minExperience = 0,
        description,
        responsibilities = [],
        requirements = [],
        salary,
        dueDate
      } = jobData;
      
      // Convert arrays to JSON strings
      const responsibilitiesJson = JSON.stringify(responsibilities);
      const requirementsJson = JSON.stringify(requirements);
      
      const query = `
        INSERT INTO job_postings (
          creator_id,
          title,
          company_name,
          position_type,
          category_id,
          location,
          contact_email,
          min_education_level,
          min_experience,
          description,
          responsibilities,
          requirements,
          salary,
          post_date,
          due_date,
          is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_DATE, $14, true)
        RETURNING *
      `;
      
      const values = [
        creatorId,
        title,
        companyName,
        positionType,
        categoryId,
        location,
        contactEmail,
        minEducationLevel,
        minExperience,
        description,
        responsibilitiesJson,
        requirementsJson,
        salary,
        dueDate
      ];
      
      const result = await pool.query(query, values);
      
      // Get category name for the response
      const categoryQuery = 'SELECT name FROM job_categories WHERE id = $1';
      const categoryResult = await pool.query(categoryQuery, [categoryId]);
      const categoryName = categoryResult.rows.length > 0 ? categoryResult.rows[0].name : null;
      
      const job = result.rows[0];
      
      // Format for frontend compatibility
      return {
        _id: job.id,
        title: job.title,
        companyName: job.company_name,
        creatorId: job.creator_id,
        positionType: job.position_type,
        categoryId: job.category_id,
        categoryName,
        location: job.location,
        contactEmail: job.contact_email,
        minEducationLevel: job.min_education_level,
        minExperience: job.min_experience,
        description: job.description,
        responsibilities: JSON.parse(job.responsibilities),
        requirements: JSON.parse(job.requirements),
        salary: job.salary,
        postDate: job.post_date,
        dueDate: job.due_date,
        isActive: job.is_active
      };
    } catch (error) {
      console.error('Error in JobPosting.create:', error);
      throw error;
    }
  },
  
  /**
   * Update a job posting
   * @param {Number} id - Job posting ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated job posting
   */
  update: async (id, updates) => {
    try {
      // Build dynamic query for updates
      const updateFields = [];
      const values = [];
      let paramIndex = 1;
      
      // Convert camelCase to snake_case for database
      for (const [key, value] of Object.entries(updates)) {
        // Skip undefined values
        if (value === undefined) continue;
        
        // Convert camelCase to snake_case
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        
        // Special handling for array fields
        if ((key === 'responsibilities' || key === 'requirements') && Array.isArray(value)) {
          updateFields.push(`${snakeKey} = $${paramIndex}`);
          values.push(JSON.stringify(value));
        } else {
          updateFields.push(`${snakeKey} = $${paramIndex}`);
          values.push(value);
        }
        
        paramIndex++;
      }
      
      // If no valid updates, return null
      if (updateFields.length === 0) {
        return null;
      }
      
      // Add id to values array
      values.push(id);
      
      const query = `
        UPDATE job_postings
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;
      
      const result = await pool.query(query, values);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const job = result.rows[0];
      
      // Get category name for response
      let categoryName = null;
      if (job.category_id) {
        const categoryQuery = 'SELECT name FROM job_categories WHERE id = $1';
        const categoryResult = await pool.query(categoryQuery, [job.category_id]);
        categoryName = categoryResult.rows.length > 0 ? categoryResult.rows[0].name : null;
      }
      
      // Parse JSON fields if they exist
      const responsibilities = job.responsibilities ? JSON.parse(job.responsibilities) : [];
      const requirements = job.requirements ? JSON.parse(job.requirements) : [];
      
      // Format for frontend compatibility
      return {
        _id: job.id,
        title: job.title,
        companyName: job.company_name,
        creatorId: job.creator_id,
        positionType: job.position_type,
        categoryId: job.category_id,
        categoryName,
        location: job.location,
        contactEmail: job.contact_email,
        minEducationLevel: job.min_education_level,
        minExperience: job.min_experience,
        description: job.description,
        responsibilities,
        requirements,
        salary: job.salary,
        postDate: job.post_date,
        dueDate: job.due_date,
        isActive: job.is_active
      };
    } catch (error) {
      console.error('Error in JobPosting.update:', error);
      throw error;
    }
  },
  
  /**
   * Delete a job posting
   * @param {Number} id - Job posting ID
   * @returns {Promise<Boolean>} Success status
   */
  delete: async (id) => {
    try {
      const query = 'DELETE FROM job_postings WHERE id = $1 RETURNING id';
      const result = await pool.query(query, [id]);
      
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error in JobPosting.delete:', error);
      throw error;
    }
  },
  
  /**
   * Count jobs by category
   * @returns {Promise<Array>} Categories with job counts
   */
  countByCategory: async () => {
    try {
      const query = `
        SELECT 
          c.id, 
          c.name, 
          COUNT(j.id) as job_count
        FROM job_categories c
        LEFT JOIN job_postings j ON c.id = j.category_id 
          AND j.is_active = true 
          AND j.due_date >= CURRENT_DATE
        GROUP BY c.id, c.name
        ORDER BY job_count DESC
      `;
      
      const result = await pool.query(query);
      
      return result.rows.map(category => ({
        _id: category.id,
        name: category.name,
        jobCount: parseInt(category.job_count)
      }));
    } catch (error) {
      console.error('Error in JobPosting.countByCategory:', error);
      throw error;
    }
  },
  
  /**
   * Get job postings by creator
   * @param {Number} creatorId - Creator's user ID
   * @returns {Promise<Array>} Job postings
   */
  findByCreator: async (creatorId) => {
    try {
      const query = `
        SELECT j.*, c.name as category_name
        FROM job_postings j
        LEFT JOIN job_categories c ON j.category_id = c.id
        WHERE j.creator_id = $1
        ORDER BY j.post_date DESC
      `;
      
      const result = await pool.query(query, [creatorId]);
      
      // Format results for frontend compatibility
      return result.rows.map(job => {
        // Parse JSON fields if they exist
        const responsibilities = job.responsibilities ? JSON.parse(job.responsibilities) : [];
        const requirements = job.requirements ? JSON.parse(job.requirements) : [];
        
        return {
          _id: job.id,
          title: job.title,
          companyName: job.company_name,
          positionType: job.position_type,
          categoryId: job.category_id,
          categoryName: job.category_name,
          location: job.location,
          contactEmail: job.contact_email,
          minEducationLevel: job.min_education_level,
          minExperience: job.min_experience,
          description: job.description,
          responsibilities,
          requirements,
          salary: job.salary,
          postDate: job.post_date,
          dueDate: job.due_date,
          isActive: job.is_active
        };
      });
    } catch (error) {
      console.error('Error in JobPosting.findByCreator:', error);
      throw error;
    }
  },
  
  /**
   * Search for jobs by keyword
   * @param {String} keyword - Search term
   * @param {Number} limit - Results limit
   * @returns {Promise<Array>} Matching job postings
   */
  search: async (keyword, limit = 10) => {
    try {
      const query = `
        SELECT j.*, c.name as category_name
        FROM job_postings j
        LEFT JOIN job_categories c ON j.category_id = c.id
        WHERE j.is_active = true 
          AND j.due_date >= CURRENT_DATE
          AND (
            j.title ILIKE $1 
            OR j.description ILIKE $1 
            OR j.company_name ILIKE $1
            OR c.name ILIKE $1
          )
        ORDER BY j.post_date DESC
        LIMIT $2
      `;
      
      const result = await pool.query(query, [`%${keyword}%`, limit]);
      
      // Format results for frontend compatibility
      return result.rows.map(job => {
        // Parse JSON fields if they exist
        const responsibilities = job.responsibilities ? JSON.parse(job.responsibilities) : [];
        const requirements = job.requirements ? JSON.parse(job.requirements) : [];
        
        return {
          _id: job.id,
          title: job.title,
          companyName: job.company_name,
          positionType: job.position_type,
          categoryId: job.category_id,
          categoryName: job.category_name,
          location: job.location,
          description: job.description,
          responsibilities,
          requirements,
          salary: job.salary,
          postDate: job.post_date,
          dueDate: job.due_date
        };
      });
    } catch (error) {
      console.error('Error in JobPosting.search:', error);
      throw error;
    }
  }
};

module.exports = JobPosting;