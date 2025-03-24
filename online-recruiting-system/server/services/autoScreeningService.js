/**
 * Automated Application Screening Service
 * Handles the automatic screening of applications when job postings reach their due date
 */
const cron = require('node-cron');
const pool = require('../config/db');
const screeningService = require('./screeningService');
const emailService = require('../utils/sendEmail');
const logger = require('../utils/logger');

class AutoScreeningService {
  constructor() {
    // Schedule for checking jobs due today - runs daily at midnight
    this.dueDateSchedule = '0 0 * * *';
    
    // Schedule for sending batch notifications - runs daily at 1:00 AM
    this.notificationSchedule = '0 1 * * *';
    
    this.isInitialized = false;
  }

  /**
   * Initialize the auto-screening service
   */
  initialize() {
    if (this.isInitialized) return;
    
    // Start due date checker
    this.startDueDateChecker();
    
    // Start notification scheduler
    this.startNotificationScheduler();
    
    // Listen for job application events
    this.setupEventListeners();
    
    this.isInitialized = true;
    logger.info('Auto-screening service initialized');
  }

  /**
   * Start the due date checker
   */
  startDueDateChecker() {
    cron.schedule(this.dueDateSchedule, async () => {
      try {
        logger.info('Running job due date check for screening');
        await this.checkJobsDueToday();
      } catch (error) {
        logger.error('Error checking jobs due today for screening:', error);
      }
    });
  }

  /**
   * Start the notification scheduler
   */
  startNotificationScheduler() {
    cron.schedule(this.notificationSchedule, async () => {
      try {
        logger.info('Running batch notifications for screened applications');
        await this.sendPendingNotifications();
      } catch (error) {
        logger.error('Error sending screening notifications:', error);
      }
    });
  }

  /**
   * Set up event listeners for application-related events
   */
  setupEventListeners() {
    // Listen for manual screening requests
    global.eventEmitter.on('processApplication', async (applicationId) => {
      try {
        logger.info(`Processing application ${applicationId} from event`);
        await this.screenSingleApplication(applicationId);
      } catch (error) {
        logger.error(`Error processing application ${applicationId}:`, error);
      }
    });
  }

  /**
   * Check for jobs that have reached their due date today
   */
  async checkJobsDueToday() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Find jobs that are due today
      const jobsQuery = `
        SELECT id, title, company_name
        FROM job_postings
        WHERE due_date::date = $1::date AND is_active = true
      `;
      
      const jobsResult = await pool.query(jobsQuery, [today]);
      
      logger.info(`Found ${jobsResult.rows.length} jobs due today for screening`);
      
      // Process each job
      for (const job of jobsResult.rows) {
        await this.processDueJob(job.id, job.title, job.company_name);
      }
    } catch (error) {
      logger.error('Error checking jobs due today:', error);
    }
  }

  /**
   * Process a job that has reached its due date
   * @param {number} jobId - Job ID to process
   * @param {string} jobTitle - Job title for notifications
   * @param {string} companyName - Company name for notifications
   */
  async processDueJob(jobId, jobTitle, companyName) {
    try {
      logger.info(`Processing due job: ${jobId} - ${jobTitle}`);
      
      // Find all pending applications for this job
      const applicationsQuery = `
        SELECT id
        FROM job_applications
        WHERE job_id = $1 AND status = 'Pending'
      `;
      
      const applicationsResult = await pool.query(applicationsQuery, [jobId]);
      
      logger.info(`Found ${applicationsResult.rows.length} pending applications for job ${jobId}`);
      
      // Screen each application
      const screeningPromises = applicationsResult.rows.map(app => 
        this.screenSingleApplication(app.id, jobTitle, companyName)
      );
      
      await Promise.all(screeningPromises);
      
      // Mark job as processed for screening
      const updateJobQuery = `
        UPDATE job_postings
        SET screening_completed = true
        WHERE id = $1
      `;
      
      await pool.query(updateJobQuery, [jobId]);
      
      logger.info(`Completed screening for job ${jobId}`);
    } catch (error) {
      logger.error(`Error processing due job ${jobId}:`, error);
    }
  }

  /**
   * Screen a single application
   * @param {number} applicationId - Application ID to screen
   * @param {string} jobTitle - Optional job title for notifications
   * @param {string} companyName - Optional company name for notifications
   */
  async screenSingleApplication(applicationId, jobTitle = null, companyName = null) {
    try {
      // Screen the application
      const screeningResult = await screeningService.screenApplication(applicationId);
      
      // Queue notification for the applicant based on result
      await this.queueApplicantNotification(
        applicationId, 
        screeningResult.passed, 
        screeningResult.score,
        jobTitle,
        companyName
      );
      
      // If passed, immediately notify HR
      if (screeningResult.passed) {
        await this.notifyHRStaff(applicationId, screeningResult.jobTitle || jobTitle);
      }
      
      return screeningResult;
    } catch (error) {
      logger.error(`Error screening application ${applicationId}:`, error);
      throw error;
    }
  }

  /**
   * Queue a notification for the applicant
   * @param {number} applicationId - Application ID
   * @param {boolean} passed - Whether application passed screening
   * @param {number} score - Screening score
   * @param {string} jobTitle - Job title
   * @param {string} companyName - Company name
   */
  async queueApplicantNotification(applicationId, passed, score, jobTitle, companyName) {
    try {
      // Add to notification queue table
      const queueQuery = `
        INSERT INTO screening_notifications (
          application_id,
          passed_screening,
          screening_score,
          job_title,
          company_name,
          notification_type,
          status,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        ON CONFLICT (application_id, notification_type) 
        DO UPDATE SET 
          passed_screening = $2,
          screening_score = $3,
          job_title = $4,
          company_name = $5,
          status = $7,
          updated_at = NOW()
      `;
      
      await pool.query(queueQuery, [
        applicationId,
        passed,
        score,
        jobTitle,
        companyName,
        'applicant_screening',
        'pending'
      ]);
      
      logger.info(`Queued ${passed ? 'pass' : 'fail'} notification for application ${applicationId}`);
    } catch (error) {
      logger.error(`Error queueing applicant notification for application ${applicationId}:`, error);
    }
  }

  /**
   * Notify HR staff immediately about a qualified applicant
   * @param {number} applicationId - Application ID
   * @param {string} jobTitle - Job title
   */
  async notifyHRStaff(applicationId, jobTitle) {
    try {
      // Get application details including HR staff email
      const applicationQuery = `
        SELECT 
          a.applicant_id,
          u.first_name as applicant_first_name,
          u.last_name as applicant_last_name,
          j.creator_id as hr_id,
          j.id as job_id,
          COALESCE($2, j.title) as job_title,
          hr.email as hr_email,
          hr.first_name as hr_first_name
        FROM job_applications a
        JOIN users u ON a.applicant_id = u.id
        JOIN job_postings j ON a.job_id = j.id
        JOIN users hr ON j.creator_id = hr.id
        WHERE a.id = $1
      `;
      
      const applicationResult = await pool.query(applicationQuery, [applicationId, jobTitle]);
      
      if (applicationResult.rows.length === 0) {
        logger.error(`Could not find application details for HR notification: ${applicationId}`);
        return;
      }
      
      const appDetails = applicationResult.rows[0];
      
      // Send email to HR staff
      const emailSubject = `Qualified Applicant: ${appDetails.job_title}`;
      const emailHtml = `
        <h1>Qualified Applicant for ${appDetails.job_title}</h1>
        <p>Hello ${appDetails.hr_first_name},</p>
        <p>A new applicant has passed the screening for <strong>${appDetails.job_title}</strong>.</p>
        <p>Applicant: <strong>${appDetails.applicant_first_name} ${appDetails.applicant_last_name}</strong></p>
        <p>You can review their application on your dashboard:</p>
        <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/applications-review/${applicationId}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Review Application</a></p>
        <p>Thank you for using our Online Recruiting System!</p>
      `;
      
      await emailService({
        to: appDetails.hr_email,
        subject: emailSubject,
        html: emailHtml
      });
      
      // Record notification in HR notifications
      const notificationQuery = `
        INSERT INTO notifications (
          user_id,
          type,
          title,
          message,
          related_id,
          is_read,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `;
      
      await pool.query(notificationQuery, [
        appDetails.hr_id,
        'qualified_applicant',
        `Qualified Applicant for ${appDetails.job_title}`,
        `${appDetails.applicant_first_name} ${appDetails.applicant_last_name} has passed screening for ${appDetails.job_title}`,
        applicationId,
        false
      ]);
      
      logger.info(`Notified HR staff (ID: ${appDetails.hr_id}) about qualified applicant for job: ${jobTitle}`);
    } catch (error) {
      logger.error(`Error notifying HR about qualified applicant for application ${applicationId}:`, error);
    }
  }

  /**
   * Send pending notifications in a batch
   */
  async sendPendingNotifications() {
    try {
      // Get pending notifications
      const pendingQuery = `
        SELECT 
          n.id,
          n.application_id,
          n.passed_screening,
          n.screening_score,
          n.job_title,
          n.company_name,
          a.applicant_id,
          u.email as applicant_email,
          u.first_name as applicant_first_name
        FROM screening_notifications n
        JOIN job_applications a ON n.application_id = a.id
        JOIN users u ON a.applicant_id = u.id
        WHERE n.status = 'pending'
        LIMIT 50
      `;
      
      const pendingResult = await pool.query(pendingQuery);
      
      logger.info(`Processing ${pendingResult.rows.length} pending screening notifications`);
      
      // Process each notification
      for (const notification of pendingResult.rows) {
        try {
          // Send email to applicant
          const emailSubject = notification.passed_screening
            ? `Your application for ${notification.job_title} has passed screening`
            : `Update on your application for ${notification.job_title}`;
          
          const emailHtml = notification.passed_screening
            ? `
              <h1>Your Application Has Passed Initial Screening</h1>
              <p>Hello ${notification.applicant_first_name},</p>
              <p>Congratulations! Your application for <strong>${notification.job_title}</strong> at <strong>${notification.company_name}</strong> has passed our initial screening process.</p>
              <p>Your screening score: <strong>${notification.screening_score}/100</strong></p>
              <p>Your application is now under review by our hiring team, and we'll be in touch soon regarding next steps.</p>
              <p>Thank you for your interest in joining our team!</p>
            `
            : `
              <h1>Update on Your Application</h1>
              <p>Hello ${notification.applicant_first_name},</p>
              <p>Thank you for applying to the <strong>${notification.job_title}</strong> position at <strong>${notification.company_name}</strong>.</p>
              <p>After careful review of your qualifications, we regret to inform you that your application did not meet our minimum requirements for this position.</p>
              <p>Your screening score: <strong>${notification.screening_score}/100</strong></p>
              <p>We encourage you to explore other opportunities that may better match your skills and experience on our job board.</p>
              <p>We appreciate your interest in our company and wish you success in your job search.</p>
            `;
          
          await emailService({
            to: notification.applicant_email,
            subject: emailSubject,
            html: emailHtml
          });
          
          // Create notification record in the user's notifications
          const userNotificationQuery = `
            INSERT INTO notifications (
              user_id,
              type,
              title,
              message,
              related_id,
              is_read,
              created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
          `;
          
          await pool.query(userNotificationQuery, [
            notification.applicant_id,
            'screening_result',
            emailSubject,
            notification.passed_screening
              ? `Your application for ${notification.job_title} has passed screening with a score of ${notification.screening_score}/100.`
              : `Your application for ${notification.job_title} did not meet the minimum requirements with a score of ${notification.screening_score}/100.`,
            notification.application_id,
            false
          ]);
          
          // Mark notification as sent
          const updateQuery = `
            UPDATE screening_notifications
            SET status = 'sent', sent_at = NOW()
            WHERE id = $1
          `;
          
          await pool.query(updateQuery, [notification.id]);
          
          logger.info(`Sent ${notification.passed_screening ? 'pass' : 'fail'} notification for application ${notification.application_id}`);
        } catch (emailError) {
          logger.error(`Error sending notification email for application ${notification.application_id}:`, emailError);
          
          // Mark as failed
          const failedQuery = `
            UPDATE screening_notifications
            SET status = 'failed', error_message = $2
            WHERE id = $1
          `;
          
          await pool.query(failedQuery, [notification.id, emailError.message]);
        }
      }
      
      logger.info(`Completed processing screening notifications`);
    } catch (error) {
      logger.error('Error sending pending notifications:', error);
    }
  }
}

// Create singleton instance
const autoScreeningService = new AutoScreeningService();

module.exports = autoScreeningService;