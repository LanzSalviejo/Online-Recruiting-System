const pool = require('../config/db');
const jobMatchingService = require('../services/jobMatchingService');

/**
 * Process matching for a new job posting
 * @route POST /api/matching/job/:jobId
 */
exports.processJobMatching = async (req, res) => {
  try {
    const { jobId } = req.params;
    
    // Process job matching and send notifications
    const results = await jobMatchingService.processNewJobMatching(jobId);
    
    res.status(200).json({
      success: true,
      message: `Found ${results.totalMatches} matching applicants and sent ${results.notificationsSent} notifications`,
      data: results
    });
  } catch (error) {
    console.error('Error processing job matching:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process job matching',
      error: error.message
    });
  }
};

/**
 * Process matching for a new user preference
 * @route POST /api/matching/preference/:preferenceId
 */
exports.processPreferenceMatching = async (req, res) => {
  try {
    const { preferenceId } = req.params;
    const userId = req.user.id;
    
    // Process preference matching and create notifications
    const results = await jobMatchingService.processNewPreferenceMatching(userId, preferenceId);
    
    res.status(200).json({
      success: true,
      message: `Found ${results.totalMatches} matching jobs`,
      data: results
    });
  } catch (error) {
    console.error('Error processing preference matching:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process preference matching',
      error: error.message
    });
  }
};

/**
 * Get job matches for the current user
 * @route GET /api/matching/jobs
 */
exports.getUserJobMatches = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find matching jobs for the user
    const matches = await jobMatchingService.findMatchingJobsForUser(userId);
    
    res.status(200).json({
      success: true,
      count: matches.length,
      data: matches
    });
  } catch (error) {
    console.error('Error getting user job matches:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get job matches',
      error: error.message
    });
  }
};

/**
 * Get applicant matches for a specific job
 * @route GET /api/matching/applicants/:jobId
 */
exports.getJobApplicantMatches = async (req, res) => {
  try {
    const { jobId } = req.params;
    
    // Verify that the requesting user has permission to view this job's matches
    // This should be done in middleware, but we'll do a simple check here
    const pool = require('../config/db');
    const jobQuery = `SELECT creator_id FROM job_postings WHERE id = $1`;
    const jobResult = await pool.query(jobQuery, [jobId]);
    
    if (jobResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    if (jobResult.rows[0].creator_id !== req.user.id && req.user.accountType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this job\'s matches'
      });
    }
    
    // Find matching applicants for the job
    const matches = await jobMatchingService.findMatchingApplicants(jobId);
    
    res.status(200).json({
      success: true,
      count: matches.length,
      data: matches
    });
  } catch (error) {
    console.error('Error getting job applicant matches:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get applicant matches',
      error: error.message
    });
  }
};

/**
 * Create a new job posting
 * @route POST /api/jobs
 * @access Private (HR only)
 */
exports.createJob = async (req, res) => {
    try {
      // Extract job data from request body
      const {
        title,
        companyName,
        positionType,
        categoryId,
        location,
        contactEmail,
        minEducationLevel,
        minExperience,
        description,
        responsibilities,
        requirements,
        salary,
        dueDate
      } = req.body;
      
      // Insert new job posting
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
      
      // If responsibilities and requirements are arrays, stringify them
      const responsibilitiesJson = Array.isArray(responsibilities) 
        ? JSON.stringify(responsibilities) 
        : responsibilities;
        
      const requirementsJson = Array.isArray(requirements)
        ? JSON.stringify(requirements)
        : requirements;
      
      const values = [
        req.user.id,
        title,
        companyName || 'Company Name', // Default if not provided
        positionType,
        categoryId,
        location,
        contactEmail || req.user.email, // Default to user email if not provided
        minEducationLevel || 'High School', // Default value
        minExperience || 0, // Default value
        description,
        responsibilitiesJson,
        requirementsJson,
        salary,
        dueDate
      ];
      
      const result = await pool.query(query, values);
      
      // Get category name to include in response
      const categoryQuery = `SELECT name FROM job_categories WHERE id = $1`;
      const categoryResult = await pool.query(categoryQuery, [categoryId]);
      
      const job = result.rows[0];
      if (categoryResult.rows.length > 0) {
        job.category_name = categoryResult.rows[0].name;
      }
      
      // Trigger matching process asynchronously
      setTimeout(() => {
        jobMatchingService.processNewJobMatching(job.id)
          .then(matchResults => {
            console.log(`Job matching process completed for job ${job.id}: ${matchResults.totalMatches} matches found, ${matchResults.notificationsSent} notifications sent`);
          })
          .catch(error => {
            console.error('Error in background job matching:', error);
          });
      }, 0);
      
      res.status(201).json(job);
    } catch (error) {
      console.error('Error creating job posting:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };
  
  /**
   * Get all jobs with filtering and pagination
   * @route GET /api/jobs
   * @access Public
   */
  exports.getAllJobs = async (req, res) => {
    try {
      // Get query parameters with defaults
      const {
        keyword,
        location,
        category,
        positionType,
        minSalary,
        dueDate,
        page = 1,
        limit = 6
      } = req.query;
      
      // Calculate pagination values
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const offset = (pageNum - 1) * limitNum;
      
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
      if (keyword) {
        queryText += ` AND (
          j.title ILIKE $${paramCount} 
          OR j.description ILIKE $${paramCount} 
          OR j.company_name ILIKE $${paramCount}
        )`;
        params.push(`%${keyword}%`);
        paramCount++;
      }
      
      if (location) {
        queryText += ` AND j.location ILIKE $${paramCount}`;
        params.push(`%${location}%`);
        paramCount++;
      }
      
      if (category) {
        // Check if category is a number (ID) or name
        if (!isNaN(category)) {
          queryText += ` AND j.category_id = $${paramCount}`;
          params.push(category);
        } else {
          queryText += ` AND c.name ILIKE $${paramCount}`;
          params.push(`%${category}%`);
        }
        paramCount++;
      }
      
      if (positionType) {
        queryText += ` AND j.position_type = $${paramCount}`;
        params.push(positionType);
        paramCount++;
      }
      
      if (minSalary) {
        queryText += ` AND j.salary >= $${paramCount}`;
        params.push(minSalary);
        paramCount++;
      }
      
      if (dueDate) {
        queryText += ` AND j.due_date >= $${paramCount}`;
        params.push(dueDate);
        paramCount++;
      }
      
      // Count total matching jobs for pagination
      const countQueryText = `
        SELECT COUNT(*) 
        FROM (${queryText}) AS filtered_jobs
      `;
      
      const countResult = await pool.query(countQueryText, params);
      const totalJobs = parseInt(countResult.rows[0].count);
      const totalPages = Math.ceil(totalJobs / limitNum);
      
      // Add sorting and pagination to the main query
      queryText += ` ORDER BY j.post_date DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
      params.push(limitNum, offset);
      
      // Execute the query
      const result = await pool.query(queryText, params);
      
      // Return the results
      res.json({
        jobs: result.rows,
        totalJobs,
        totalPages,
        currentPage: pageNum
      });
    } catch (error) {
      console.error('Error fetching jobs:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };
  
  /**
   * Get a specific job by ID
   * @route GET /api/jobs/:id
   * @access Public
   */
  exports.getJobById = async (req, res) => {
    try {
      const jobId = req.params.id;
      
      // Validate that id is a number
      if (isNaN(jobId)) {
        return res.status(400).json({ message: 'Invalid job ID' });
      }
      
      const query = `
        SELECT j.*, c.name as category_name
        FROM job_postings j
        LEFT JOIN job_categories c ON j.category_id = c.id
        WHERE j.id = $1
      `;
      
      const result = await pool.query(query, [jobId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Job not found' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error fetching job details:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };
  
  /**
   * Update a job posting
   * @route PUT /api/jobs/:id
   * @access Private (HR only)
   */
  exports.updateJob = async (req, res) => {
    try {
      const jobId = req.params.id;
      
      // Check if job exists and belongs to the user
      const checkQuery = `SELECT creator_id FROM job_postings WHERE id = $1`;
      const checkResult = await pool.query(checkQuery, [jobId]);
      
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ message: 'Job not found' });
      }
      
      // Check if user is the creator
      if (checkResult.rows[0].creator_id !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to update this job' });
      }
      
      // Build update query dynamically based on provided fields
      const updates = [];
      const values = [];
      let paramCount = 1;
      
      // List of allowed fields to update
      const allowedFields = [
        'title', 'company_name', 'position_type', 'category_id', 'location',
        'contact_email', 'min_education_level', 'min_experience', 'description',
        'responsibilities', 'requirements', 'salary', 'due_date', 'is_active'
      ];
      
      // Convert camelCase keys to snake_case for database
      for (const [key, value] of Object.entries(req.body)) {
        // Convert camelCase to snake_case
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        
        if (allowedFields.includes(snakeKey) && value !== undefined) {
          // Special handling for array fields
          if ((snakeKey === 'responsibilities' || snakeKey === 'requirements') && Array.isArray(value)) {
            updates.push(`${snakeKey} = $${paramCount}`);
            values.push(JSON.stringify(value));
          } else {
            updates.push(`${snakeKey} = $${paramCount}`);
            values.push(value);
          }
          paramCount++;
        }
      }
      
      // If there are no updates, return the original job
      if (updates.length === 0) {
        return res.status(400).json({ message: 'No valid fields to update' });
      }
      
      // Add job ID to values array
      values.push(jobId);
      
      const query = `
        UPDATE job_postings
        SET ${updates.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;
      
      const result = await pool.query(query, values);
      
      // Get category name to include in response
      if (result.rows[0].category_id) {
        const categoryQuery = `SELECT name FROM job_categories WHERE id = $1`;
        const categoryResult = await pool.query(categoryQuery, [result.rows[0].category_id]);
        
        if (categoryResult.rows.length > 0) {
          result.rows[0].category_name = categoryResult.rows[0].name;
        }
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating job posting:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };
  
  /**
   * Delete a job posting
   * @route DELETE /api/jobs/:id
   * @access Private (HR or Admin)
   */
  exports.deleteJob = async (req, res) => {
    try {
      const jobId = req.params.id;
      
      // Get job info
      const jobQuery = `SELECT creator_id FROM job_postings WHERE id = $1`;
      const jobResult = await pool.query(jobQuery, [jobId]);
      
      if (jobResult.rows.length === 0) {
        return res.status(404).json({ message: 'Job not found' });
      }
      
      // Check if user is the creator or an admin
      if (req.user.accountType === 'hr' && jobResult.rows[0].creator_id !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to delete this job' });
      }
      
      // Delete the job posting
      const deleteQuery = `DELETE FROM job_postings WHERE id = $1`;
      await pool.query(deleteQuery, [jobId]);
      
      res.json({ message: 'Job posting deleted successfully' });
    } catch (error) {
      console.error('Error deleting job posting:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };
  
  /**
   * Get featured job listings
   * @route GET /api/jobs/featured
   * @access Public
   */
  exports.getFeaturedJobs = async (req, res) => {
    try {
      const query = `
        SELECT j.*, c.name as category_name
        FROM job_postings j
        LEFT JOIN job_categories c ON j.category_id = c.id
        WHERE j.is_active = true AND j.due_date >= CURRENT_DATE
        ORDER BY j.post_date DESC
        LIMIT 6
      `;
      
      const result = await pool.query(query);
      
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching featured jobs:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };