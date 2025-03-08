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