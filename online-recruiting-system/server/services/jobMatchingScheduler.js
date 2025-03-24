/**
 * Job Matching Scheduler Service
 * Handles automatic job matching notifications using node-cron
 */
const cron = require('node-cron');
const jobMatchingService = require('./jobMatchingService');
const pool = require('../config/db');
const logger = require('../utils/logger');

class JobMatchingScheduler {
  constructor() {
    // Schedule for checking new matches - runs every hour
    this.matchingSchedule = '0 * * * *';
    
    // Schedule for checking after job due dates - runs daily at midnight
    this.dueDateSchedule = '0 0 * * *'; // Fixed typo from "dueeDateSchedule"
    
    this.isInitialized = false;
  }

  /**
   * Initialize the scheduler
   */
  initialize() {
    if (this.isInitialized) return;
    
    // Start job matching scheduler
    this.startJobMatchingScheduler();
    
    // Start due date checker
    this.startDueDateChecker();
    
    // Setup listeners for new job postings
    this.setupJobPostingListener();
    
    this.isInitialized = true;
    logger.info('Job matching scheduler initialized');
  }

  /**
   * Start the job matching scheduler
   */
  startJobMatchingScheduler() {
    cron.schedule(this.matchingSchedule, async () => {
      try {
        logger.info('Running scheduled job matching check');
        await this.checkForNewMatches();
      } catch (error) {
        logger.error('Error in scheduled job matching:', error);
      }
    });
  }

  /**
   * Start the due date checker
   */
  startDueDateChecker() {
    cron.schedule(this.dueDateSchedule, async () => { // Fixed typo from "dueeDateSchedule"
      try {
        logger.info('Running job due date check');
        await this.checkJobsDueToday();
      } catch (error) {
        logger.error('Error checking jobs due today:', error);
      }
    });
  }

  /**
   * Sets up listeners for new job postings to trigger immediate matching
   */
  setupJobPostingListener() {
    // Using a custom event emitter to handle new job notifications
    global.eventEmitter.on('newJobPosted', async (jobId) => {
      try {
        logger.info(`New job posted with ID: ${jobId}, processing matches`);
        await jobMatchingService.processNewJobMatching(jobId);
      } catch (error) {
        logger.error(`Error processing matches for new job ${jobId}:`, error);
      }
    });
    
    // Listen for preference updates
    global.eventEmitter.on('preferenceUpdated', async (userId, preferenceId) => {
      try {
        logger.info(`User ${userId} updated preference ${preferenceId}, processing matches`);
        await jobMatchingService.processNewPreferenceMatching(userId, preferenceId);
      } catch (error) {
        logger.error(`Error processing matches for updated preference:`, error);
      }
    });
  }

  /**
   * Check for new matches across all users and jobs
   */
  async checkForNewMatches() {
    try {
      logger.info('Checking for new job matches');
      
      // Get all active job preferences
      const preferencesQuery = `
        SELECT jp.user_id, jp.id as preference_id
        FROM job_preferences jp
        JOIN users u ON jp.user_id = u.id
        WHERE u.is_active = true AND u.account_type = 'applicant'
      `;
      
      const prefResult = await pool.query(preferencesQuery);
      
      // Process each user's preferences
      for (const pref of prefResult.rows) {
        await jobMatchingService.processNewPreferenceMatching(
          pref.user_id, 
          pref.preference_id
        );
      }
      
      logger.info(`Completed checking matches for ${prefResult.rows.length} users`);
    } catch (error) {
      logger.error('Error checking for new matches:', error);
    }
  }

  /**
   * Check for jobs that are due today and need processing
   */
  async checkJobsDueToday() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Find jobs that are due today
      const jobsQuery = `
        SELECT id
        FROM job_postings
        WHERE due_date::date = $1::date AND is_active = true
      `;
      
      const jobsResult = await pool.query(jobsQuery, [today]);
      
      logger.info(`Found ${jobsResult.rows.length} jobs due today`);
      
      // Trigger final processing for these jobs
      for (const job of jobsResult.rows) {
        await this.processDueJob(job.id);
      }
    } catch (error) {
      logger.error('Error checking jobs due today:', error);
    }
  }

  /**
   * Process a job that has reached its due date
   * @param {number} jobId - Job ID to process
   */
  async processDueJob(jobId) {
    try {
      logger.info(`Processing due job: ${jobId}`);
      
      // Find all applications for this job
      const applicationsQuery = `
        SELECT id
        FROM job_applications
        WHERE job_id = $1 AND (status = 'Pending' OR status IS NULL)
      `;
      
      const applicationsResult = await pool.query(applicationsQuery, [jobId]);
      
      // Send to screening service
      for (const app of applicationsResult.rows) {
        // This would call the screening service
        global.eventEmitter.emit('processApplication', app.id);
      }
      
      logger.info(`Processed ${applicationsResult.rows.length} applications for job ${jobId}`);
    } catch (error) {
      logger.error(`Error processing due job ${jobId}:`, error);
    }
  }
}

// Singleton instance
const jobMatchingScheduler = new JobMatchingScheduler();

module.exports = jobMatchingScheduler;