const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const pool = require('../config/db');

// Middleware to ensure user is HR staff
const hrOnly = roleCheck('hr');

// Get HR dashboard stats
router.get('/stats', [auth, hrOnly], async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get active job postings created by this HR staff
    const activeJobsQuery = `
      SELECT COUNT(*) as count
      FROM job_postings
      WHERE creator_id = $1 AND is_active = true
    `;
    const activeJobsResult = await pool.query(activeJobsQuery, [userId]);
    const activeJobs = parseInt(activeJobsResult.rows[0].count);
    
    // Get all job IDs by this HR staff
    const jobIdsQuery = `
      SELECT id FROM job_postings WHERE creator_id = $1
    `;
    const jobIdsResult = await pool.query(jobIdsQuery, [userId]);
    const jobIds = jobIdsResult.rows.map(row => row.id);
    
    // If no jobs found, return zeros for stats
    if (jobIds.length === 0) {
      return res.json({
        activeJobs: 0,
        totalApplications: 0,
        newApplications: 0,
        interviewScheduled: 0
      });
    }
    
    // Get application statistics for these jobs
    const statsQuery = `
      SELECT 
        COUNT(*) as total_applications,
        COUNT(CASE WHEN status IN ('Pending', 'New') THEN 1 END) as new_applications,
        COUNT(CASE WHEN status = 'Interview' THEN 1 END) as interview_scheduled
      FROM job_applications
      WHERE job_id IN (${jobIds.join(',')})
    `;
    
    const statsResult = await pool.query(statsQuery);
    const applicationStats = statsResult.rows[0];
    
    // Calculate stats
    const stats = {
      activeJobs,
      totalApplications: parseInt(applicationStats.total_applications) || 0,
      newApplications: parseInt(applicationStats.new_applications) || 0,
      interviewScheduled: parseInt(applicationStats.interview_scheduled) || 0
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching HR stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get recent job postings
router.get('/jobs/recent', [auth, hrOnly], async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get recent job postings by this HR staff
    const jobsQuery = `
      SELECT j.*, c.name as category_name
      FROM job_postings j
      LEFT JOIN job_categories c ON j.category_id = c.id
      WHERE j.creator_id = $1
      ORDER BY j.post_date DESC
      LIMIT 5
    `;
    
    const jobsResult = await pool.query(jobsQuery, [userId]);
    
    // Get application counts for each job
    const jobsWithCounts = await Promise.all(
      jobsResult.rows.map(async (job) => {
        const countQuery = `
          SELECT COUNT(*) as count
          FROM job_applications
          WHERE job_id = $1
        `;
        const countResult = await pool.query(countQuery, [job.id]);
        const applicationsCount = parseInt(countResult.rows[0].count);
        
        return {
          _id: job.id,
          title: job.title,
          category: job.category_name || 'Uncategorized',
          location: job.location,
          applicationsCount,
          postDate: job.post_date,
          dueDate: job.due_date
        };
      })
    );
    
    res.json(jobsWithCounts);
  } catch (error) {
    console.error('Error fetching recent job postings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get recent applications
router.get('/applications/recent', [auth, hrOnly], async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get recent applications for jobs created by this HR staff
    const applicationsQuery = `
      SELECT 
        a.*,
        j.title as job_title,
        u.first_name,
        u.last_name,
        u.id as applicant_id
      FROM job_applications a
      JOIN job_postings j ON a.job_id = j.id
      JOIN users u ON a.applicant_id = u.id
      WHERE j.creator_id = $1
      ORDER BY a.application_date DESC
      LIMIT 5
    `;
    
    const applicationsResult = await pool.query(applicationsQuery, [userId]);
    
    // Format the results
    const populatedApplications = applicationsResult.rows.map(app => ({
      _id: app.id,
      jobId: app.job_id,
      jobTitle: app.job_title,
      applicantId: app.applicant_id,
      applicantName: `${app.first_name} ${app.last_name}`,
      status: app.status,
      applicationDate: app.application_date,
      screening: app.screening_score ? {
        score: app.screening_score,
        passed: app.passed_screening
      } : null
    }));
    
    res.json(populatedApplications);
  } catch (error) {
    console.error('Error fetching recent applications:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all job postings created by the HR user
router.get('/job-postings', [auth, hrOnly], async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get all job postings by this HR staff
    const jobsQuery = `
      SELECT j.*, c.name as category_name
      FROM job_postings j
      LEFT JOIN job_categories c ON j.category_id = c.id
      WHERE j.creator_id = $1
      ORDER BY j.post_date DESC
    `;
    
    const jobsResult = await pool.query(jobsQuery, [userId]);
    
    // Get application counts for each job
    const jobsWithCounts = await Promise.all(
      jobsResult.rows.map(async (job) => {
        const countQuery = `
          SELECT COUNT(*) as count
          FROM job_applications
          WHERE job_id = $1
        `;
        const countResult = await pool.query(countQuery, [job.id]);
        const applicationsCount = parseInt(countResult.rows[0].count);
        
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
          responsibilities: typeof job.responsibilities === 'string' ? 
                           JSON.parse(job.responsibilities) : 
                           job.responsibilities || [],
          requirements: typeof job.requirements === 'string' ? 
                        JSON.parse(job.requirements) : 
                        job.requirements || [],
          salary: job.salary,
          postDate: job.post_date,
          dueDate: job.due_date,
          isActive: job.is_active,
          applicationsCount
        };
      })
    );
    
    res.json(jobsWithCounts);
  } catch (error) {
    console.error('Error fetching job postings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all applications for jobs created by the HR user
router.get('/applications', [auth, hrOnly], async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get all applications for jobs created by this HR staff
    const applicationsQuery = `
      SELECT 
        a.*,
        j.title as job_title,
        j.company_name,
        j.position_type,
        u.first_name,
        u.last_name,
        u.email,
        u.id as applicant_id
      FROM job_applications a
      JOIN job_postings j ON a.job_id = j.id
      JOIN users u ON a.applicant_id = u.id
      WHERE j.creator_id = $1
      ORDER BY a.application_date DESC
    `;
    
    const applicationsResult = await pool.query(applicationsQuery, [userId]);
    
    // Format the results
    const populatedApplications = applicationsResult.rows.map(app => ({
      _id: app.id,
      jobId: app.job_id,
      jobTitle: app.job_title,
      companyName: app.company_name,
      positionType: app.position_type,
      applicantId: app.applicant_id,
      applicantName: `${app.first_name} ${app.last_name}`,
      applicantEmail: app.email,
      status: app.status,
      applicationDate: app.application_date,
      screening: app.screening_score ? {
        score: app.screening_score,
        passed: app.passed_screening
      } : null
    }));
    
    res.json(populatedApplications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;