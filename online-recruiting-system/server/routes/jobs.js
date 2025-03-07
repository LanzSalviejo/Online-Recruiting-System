const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { check, validationResult } = require('express-validator');

/**
 * @route   GET /api/jobs
 * @desc    Get all jobs with filtering and pagination
 * @access  Public
 */
router.get('/', async (req, res) => {
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
});

/**
 * @route   GET /api/jobs/featured
 * @desc    Get featured job listings (recent and active)
 * @access  Public
 */
router.get('/featured', async (req, res) => {
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
});

/**
 * @route   GET /api/jobs/categories
 * @desc    Get job categories with job counts
 * @access  Public
 */
router.get('/categories', async (req, res) => {
  try {
    const query = `
      SELECT 
        c.id, 
        c.name, 
        COUNT(j.id) as job_count
      FROM job_categories c
      LEFT JOIN job_postings j ON c.id = j.category_id AND j.is_active = true AND j.due_date >= CURRENT_DATE
      GROUP BY c.id, c.name
      ORDER BY job_count DESC
    `;
    
    const result = await pool.query(query);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching job categories:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/jobs/:id
 * @desc    Get a specific job by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
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
});

/**
 * @route   POST /api/jobs
 * @desc    Create a new job posting
 * @access  Private (HR only)
 */
router.post('/', [auth, roleCheck('hr'), [
  check('title', 'Title is required').not().isEmpty(),
  check('positionType', 'Position type is required').isIn(['Full Time', 'Part Time', 'Contract', 'Internship', 'Co-op']),
  check('categoryId', 'Category is required').not().isEmpty(),
  check('location', 'Location is required').not().isEmpty(),
  check('description', 'Description is required').not().isEmpty(),
  check('dueDate', 'Due date is required').not().isEmpty()
]], async (req, res) => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
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
  
  try {
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
    
    res.status(201).json(job);
  } catch (error) {
    console.error('Error creating job posting:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PUT /api/jobs/:id
 * @desc    Update a job posting
 * @access  Private (HR only)
 */
router.put('/:id', [auth, roleCheck('hr')], async (req, res) => {
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
});

/**
 * @route   DELETE /api/jobs/:id
 * @desc    Delete a job posting
 * @access  Private (HR or Admin)
 */
router.delete('/:id', [auth, roleCheck(['hr', 'admin'])], async (req, res) => {
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
});

/**
 * @route   POST /api/jobs/apply/:id
 * @desc    Apply for a job
 * @access  Private (Applicants only)
 */
router.post('/apply/:id', [auth, roleCheck('applicant')], async (req, res) => {
  try {
    const jobId = req.params.id;
    const userId = req.user.id;
    
    // Check if job exists and is active
    const jobQuery = `
      SELECT * FROM job_postings 
      WHERE id = $1 AND is_active = true AND due_date >= CURRENT_DATE
    `;
    const jobResult = await pool.query(jobQuery, [jobId]);
    
    if (jobResult.rows.length === 0) {
      return res.status(404).json({ 
        message: 'Job not found or no longer accepting applications' 
      });
    }
    
    // Check if user has already applied
    const checkQuery = `
      SELECT * FROM job_applications 
      WHERE job_id = $1 AND applicant_id = $2
    `;
    const checkResult = await pool.query(checkQuery, [jobId, userId]);
    
    if (checkResult.rows.length > 0) {
      return res.status(400).json({ message: 'You have already applied for this job' });
    }
    
    // Extract application data from request
    const { coverLetter, resumePath } = req.body;
    
    // Insert application
    const insertQuery = `
      INSERT INTO job_applications (
        job_id, 
        applicant_id, 
        application_date, 
        cover_letter, 
        resume_path, 
        status, 
        passed_screening
      ) 
      VALUES ($1, $2, CURRENT_DATE, $3, $4, 'Pending', false)
      RETURNING *
    `;
    
    const values = [jobId, userId, coverLetter || '', resumePath || ''];
    const result = await pool.query(insertQuery, values);
    
    // Return the new application
    res.status(201).json({
      message: 'Application submitted successfully',
      application: result.rows[0]
    });
    
    // Trigger application screening process
    // This would typically be handled by a separate function or service
    // screenApplication(result.rows[0].id);
    
  } catch (error) {
    console.error('Error applying for job:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/jobs/applications/:id
 * @desc    Get all applications for a specific job
 * @access  Private (HR only)
 */
router.get('/applications/:id', [auth, roleCheck('hr')], async (req, res) => {
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
      return res.status(403).json({ message: 'Not authorized to view these applications' });
    }
    
    // Get all applications for this job
    const applicationsQuery = `
      SELECT a.*, 
        u.first_name, 
        u.last_name, 
        u.email,
        j.title as job_title
      FROM job_applications a
      JOIN users u ON a.applicant_id = u.id
      JOIN job_postings j ON a.job_id = j.id
      WHERE a.job_id = $1
      ORDER BY a.application_date DESC
    `;
    
    const result = await pool.query(applicationsQuery, [jobId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching job applications:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;