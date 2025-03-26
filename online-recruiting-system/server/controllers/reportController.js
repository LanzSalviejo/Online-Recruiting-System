const pool = require('../config/db');

/**
 * Get monthly category report
 * @route GET /api/reports/category/monthly/:year/:month
 * @access Private (Admin only)
 */
exports.getMonthlyCategoryReport = async (req, res) => {
  try {
    const { year, month } = req.params;
    
    // Validate input
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);
    
    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid year or month parameters' 
      });
    }
    
    // Calculate start and end dates for the given month
    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 0); // Last day of the month
    
    // Get job applications by category for the specified month
    const query = `
      SELECT 
        c.id as category_id,
        c.name as category_name,
        COUNT(DISTINCT j.id) as job_postings_count,
        COUNT(a.id) as total_applications
      FROM job_categories c
      LEFT JOIN job_postings j ON c.id = j.category_id
        AND j.post_date >= $1 AND j.post_date <= $2
      LEFT JOIN job_applications a ON j.id = a.job_id
        AND a.application_date >= $1 AND a.application_date <= $2
      GROUP BY c.id, c.name
      ORDER BY total_applications DESC
    `;
    
    const result = await pool.query(query, [startDate, endDate]);
    
    res.status(200).json({
      success: true,
      data: result.rows,
      period: {
        year: yearNum,
        month: monthNum,
        startDate,
        endDate
      }
    });
  } catch (error) {
    console.error('Error generating monthly category report:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error generating report' 
    });
  }
};

/**
 * Get yearly category report
 * @route GET /api/reports/category/yearly/:year
 * @access Private (Admin only)
 */
exports.getYearlyCategoryReport = async (req, res) => {
  try {
    const { year } = req.params;
    
    // Validate input
    const yearNum = parseInt(year);
    
    if (isNaN(yearNum)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid year parameter' 
      });
    }
    
    // Calculate start and end dates for the given year
    const startDate = new Date(yearNum, 0, 1);
    const endDate = new Date(yearNum, 11, 31);
    
    // Get job applications by category for the specified year
    const query = `
      SELECT 
        c.id as category_id,
        c.name as category_name,
        COUNT(DISTINCT j.id) as job_postings_count,
        COUNT(a.id) as total_applications
      FROM job_categories c
      LEFT JOIN job_postings j ON c.id = j.category_id
        AND j.post_date >= $1 AND j.post_date <= $2
      LEFT JOIN job_applications a ON j.id = a.job_id
        AND a.application_date >= $1 AND a.application_date <= $2
      GROUP BY c.id, c.name
      ORDER BY total_applications DESC
    `;
    
    const result = await pool.query(query, [startDate, endDate]);
    
    res.status(200).json({
      success: true,
      data: result.rows,
      period: {
        year: yearNum,
        startDate,
        endDate
      }
    });
  } catch (error) {
    console.error('Error generating yearly category report:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error generating report' 
    });
  }
};

/**
 * Get monthly qualification rate report
 * @route GET /api/reports/qualification/monthly/:year/:month
 * @access Private (Admin only)
 */
exports.getMonthlyQualificationReport = async (req, res) => {
  try {
    const { year, month } = req.params;
    
    // Validate input
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);
    
    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid year or month parameters' 
      });
    }
    
    // Calculate start and end dates for the given month
    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 0); // Last day of the month
    
    // Get qualification rates for jobs in the specified month
    const query = `
      SELECT 
        j.id as job_id,
        j.title as job_title,
        c.id as category_id,
        c.name as category_name,
        COUNT(a.id) as total_applications,
        SUM(CASE WHEN a.passed_screening = true THEN 1 ELSE 0 END) as qualified_applications,
        CASE 
          WHEN COUNT(a.id) > 0 
          THEN CAST(SUM(CASE WHEN a.passed_screening = true THEN 1 ELSE 0 END) AS FLOAT) / COUNT(a.id)
          ELSE 0
        END as qualification_rate
      FROM job_postings j
      LEFT JOIN job_categories c ON j.category_id = c.id
      LEFT JOIN job_applications a ON j.id = a.job_id
        AND a.application_date >= $1 AND a.application_date <= $2
      WHERE j.post_date >= $1 AND j.post_date <= $2
      GROUP BY j.id, j.title, c.id, c.name
      HAVING COUNT(a.id) > 0
      ORDER BY qualification_rate ASC
    `;
    
    const result = await pool.query(query, [startDate, endDate]);
    
    // Add difficulty level based on qualification rate
    const reportData = result.rows.map(job => ({
      ...job,
      difficulty: getQualificationDifficulty(job.qualification_rate)
    }));
    
    res.status(200).json({
      success: true,
      data: reportData,
      period: {
        year: yearNum,
        month: monthNum,
        startDate,
        endDate
      }
    });
  } catch (error) {
    console.error('Error generating monthly qualification report:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error generating report' 
    });
  }
};

/**
 * Get yearly qualification rate report
 * @route GET /api/reports/qualification/yearly/:year
 * @access Private (Admin only)
 */
exports.getYearlyQualificationReport = async (req, res) => {
  try {
    const { year } = req.params;
    
    // Validate input
    const yearNum = parseInt(year);
    
    if (isNaN(yearNum)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid year parameter' 
      });
    }
    
    // Calculate start and end dates for the given year
    const startDate = new Date(yearNum, 0, 1);
    const endDate = new Date(yearNum, 11, 31);
    
    // Get qualification rates for jobs in the specified year
    const query = `
      SELECT 
        j.id as job_id,
        j.title as job_title,
        c.id as category_id,
        c.name as category_name,
        COUNT(a.id) as total_applications,
        SUM(CASE WHEN a.passed_screening = true THEN 1 ELSE 0 END) as qualified_applications,
        CASE 
          WHEN COUNT(a.id) > 0 
          THEN CAST(SUM(CASE WHEN a.passed_screening = true THEN 1 ELSE 0 END) AS FLOAT) / COUNT(a.id)
          ELSE 0
        END as qualification_rate
      FROM job_postings j
      LEFT JOIN job_categories c ON j.category_id = c.id
      LEFT JOIN job_applications a ON j.id = a.job_id
        AND a.application_date >= $1 AND a.application_date <= $2
      WHERE j.post_date >= $1 AND j.post_date <= $2
      GROUP BY j.id, j.title, c.id, c.name
      HAVING COUNT(a.id) > 0
      ORDER BY qualification_rate ASC
    `;
    
    const result = await pool.query(query, [startDate, endDate]);
    
    // Add difficulty level based on qualification rate
    const reportData = result.rows.map(job => ({
      ...job,
      difficulty: getQualificationDifficulty(job.qualification_rate)
    }));
    
    res.status(200).json({
      success: true,
      data: reportData,
      period: {
        year: yearNum,
        startDate,
        endDate
      }
    });
  } catch (error) {
    console.error('Error generating yearly qualification report:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error generating report' 
    });
  }
};

/**
 * Helper function to determine the difficulty level based on qualification rate
 * @param {Number} rate - Qualification rate between 0 and 1
 * @returns {String} - Difficulty level description
 */
const getQualificationDifficulty = (rate) => {
  const rateNum = parseFloat(rate);
  
  if (rateNum < 0.10) return 'Very Hard';
  if (rateNum < 0.25) return 'Hard';
  if (rateNum < 0.50) return 'Moderate';
  if (rateNum < 0.75) return 'Easy';
  return 'Very Easy';
};