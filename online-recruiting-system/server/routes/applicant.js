const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const pool = require('../config/db');

// Get applicant dashboard stats
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const statsQuery = `
      SELECT 
        COUNT(*) as total_applications,
        COUNT(CASE WHEN status IN ('Pending', 'Under Review') THEN 1 END) as pending_applications,
        COUNT(CASE WHEN status = 'Interview' THEN 1 END) as interview_invitations,
        COUNT(CASE WHEN status = 'Rejected' THEN 1 END) as rejected_applications
      FROM job_applications
      WHERE applicant_id = $1
    `;
    
    const statsResult = await pool.query(statsQuery, [userId]);
    
    // Format the stats
    const stats = {
      totalApplications: parseInt(statsResult.rows[0].total_applications || 0),
      pendingApplications: parseInt(statsResult.rows[0].pending_applications || 0),
      interviewInvitations: parseInt(statsResult.rows[0].interview_invitations || 0),
      rejectedApplications: parseInt(statsResult.rows[0].rejected_applications || 0)
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching applicant stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get recent applications
router.get('/applications/recent', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get most recent applications using PostgreSQL query
    const applicationsQuery = `
      SELECT 
        a.id as _id,
        a.job_id as "jobId",
        j.title as "jobTitle",
        j.company_name as "companyName",
        a.status,
        a.application_date as "applicationDate"
      FROM job_applications a
      JOIN job_postings j ON a.job_id = j.id
      WHERE a.applicant_id = $1
      ORDER BY a.application_date DESC
      LIMIT 5
    `;
    
    const applicationsResult = await pool.query(applicationsQuery, [userId]);
    
    res.json(applicationsResult.rows);
  } catch (error) {
    console.error('Error fetching recent applications:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get job recommendations
router.get('/recommendations', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Check if job_preferences table exists
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'job_preferences'
      );
    `;
    
    const tableExists = await pool.query(checkTableQuery);
    let recommendations = [];
    
    if (tableExists.rows[0].exists) {
      // Get user's job preferences to make recommendations more relevant
      const preferencesQuery = `
        SELECT category, position_type, location, min_salary
        FROM job_preferences
        WHERE user_id = $1
      `;
      
      const preferencesResult = await pool.query(preferencesQuery, [userId]);
      const preferences = preferencesResult.rows;
      
      // Simple recommendation query that factors in user preferences if available
      let recommendationsQuery = `
        SELECT 
          j.id as _id,
          j.title,
          j.company_name as "companyName",
          j.location,
          j.position_type as "positionType",
          j.salary
        FROM job_postings j
        LEFT JOIN job_categories c ON j.category_id = c.id
        WHERE j.is_active = true AND j.due_date >= CURRENT_DATE
      `;
      
      // Add preference filters if available
      const queryParams = [];
      
      if (preferences.length > 0) {
        // Use first preference for simplification
        const pref = preferences[0];
        
        recommendationsQuery += ` ORDER BY (
          CASE WHEN c.name = $1 THEN 40 ELSE 0 END +
          CASE WHEN j.position_type = $2 THEN 30 ELSE 0 END +
          CASE WHEN j.location ILIKE '%' || $3 || '%' THEN 20 ELSE 0 END +
          CASE WHEN j.salary >= $4 THEN 10 ELSE 0 END
        ) DESC`;
        
        queryParams.push(
          pref.category || '',
          pref.position_type || '',
          pref.location || '',
          pref.min_salary || 0
        );
      } else {
        // If no preferences, order by post date
        recommendationsQuery += ` ORDER BY j.post_date DESC`;
      }
      
      recommendationsQuery += ` LIMIT 3`;
      
      const recommendationsResult = await pool.query(recommendationsQuery, queryParams);
      
      // Add mock match scores based on relevance
      recommendations = recommendationsResult.rows.map((job, index) => ({
        ...job,
        matchScore: 98 - (index * 5) // Simple mock scoring: 98%, 93%, 88%
      }));
    } else {
      // If job_preferences table doesn't exist, fetch recent jobs
      const recentJobsQuery = `
        SELECT 
          j.id as _id,
          j.title,
          j.company_name as "companyName",
          j.location,
          j.position_type as "positionType",
          j.salary
        FROM job_postings j
        WHERE j.is_active = true AND j.due_date >= CURRENT_DATE
        ORDER BY j.post_date DESC
        LIMIT 3
      `;
      
      const recentJobsResult = await pool.query(recentJobsQuery);
      
      // Add mock match scores
      recommendations = recentJobsResult.rows.map((job, index) => ({
        ...job,
        matchScore: 90 - (index * 5) // Simple mock scoring: 90%, 85%, 80%
      }));
    }
    
    res.json(recommendations);
  } catch (error) {
    console.error('Error fetching job recommendations:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get notifications
router.get('/notifications', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Check if notifications table exists
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications'
      );
    `;
    
    const tableExists = await pool.query(checkTableQuery);
    
    if (tableExists.rows[0].exists) {
      // Get recent notifications for this user
      const notificationsQuery = `
        SELECT 
          id as _id, 
          type, 
          message, 
          created_at as date, 
          is_read as read
        FROM notifications
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 5
      `;
      
      const notificationsResult = await pool.query(notificationsQuery, [userId]);
      res.json(notificationsResult.rows);
    } else {
      // Return empty array if table doesn't exist
      res.json([]);
    }
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;