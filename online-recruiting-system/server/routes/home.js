const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Get featured job listings
router.get('/jobs/featured', async (req, res) => {
  try {
    // Get featured or recent active jobs
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

// Get job categories with job counts
router.get('/jobs/categories', async (req, res) => {
  try {
    // Get categories with job counts
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
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching job categories:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get platform statistics
router.get('/stats/platform', async (req, res) => {
  try {
    // Calculate platform stats using PostgreSQL queries
    
    // Count total active jobs
    const totalJobsQuery = `
      SELECT COUNT(*) as count
      FROM job_postings
      WHERE is_active = true 
      AND due_date >= CURRENT_DATE
    `;
    const totalJobsResult = await pool.query(totalJobsQuery);
    const totalJobs = parseInt(totalJobsResult.rows[0].count);
    
    // Count unique companies
    const uniqueCompaniesQuery = `
      SELECT COUNT(DISTINCT company_name) as count
      FROM job_postings
    `;
    const uniqueCompaniesResult = await pool.query(uniqueCompaniesQuery);
    const totalCompanies = parseInt(uniqueCompaniesResult.rows[0].count);
    
    // Count total applicants
    const totalApplicantsQuery = `
      SELECT COUNT(*) as count
      FROM users
      WHERE account_type = 'applicant'
    `;
    const totalApplicantsResult = await pool.query(totalApplicantsQuery);
    const totalApplicants = parseInt(totalApplicantsResult.rows[0].count);
    
    // Count jobs posted this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const jobsThisMonthQuery = `
      SELECT COUNT(*) as count
      FROM job_postings
      WHERE post_date >= $1
    `;
    const jobsThisMonthResult = await pool.query(jobsThisMonthQuery, [startOfMonth]);
    const jobsThisMonth = parseInt(jobsThisMonthResult.rows[0].count);
    
    const stats = {
      totalJobs,
      totalCompanies,
      totalApplicants,
      jobsThisMonth
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching platform stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;