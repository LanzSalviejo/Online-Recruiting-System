const screeningService = require('../services/screeningService');
const emailService = require('../utils/sendEmail');

/**
 * Controller for handling application screening operations
 */
exports.screenApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    
    // Validate that the application belongs to a job posted by the HR staff
    // This is a security check to prevent unauthorized screening
    const authorized = await isAuthorizedToScreen(req.user.id, applicationId);
    if (!authorized) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to screen this application' 
      });
    }
    
    // Process the screening
    const screeningResults = await screeningService.screenApplication(applicationId);
    
    // Return screening results
    res.status(200).json({
      success: true,
      data: screeningResults
    });
    
    // Asynchronously send notifications
    sendScreeningNotification(screeningResults);
  } catch (error) {
    console.error('Error in screenApplication controller:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to screen application',
      error: error.message
    });
  }
};

exports.batchProcessScreening = async (req, res) => {
  try {
    // Only admin users can trigger batch processing
    if (req.user.accountType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can run batch screening'
      });
    }
    
    const batchSize = req.query.batchSize ? parseInt(req.query.batchSize) : 10;
    
    // Validate batch size range
    if (batchSize < 1 || batchSize > 50) {
      return res.status(400).json({
        success: false,
        message: 'Batch size must be between 1 and 50'
      });
    }
    
    // Run batch processing
    const results = await screeningService.processPendingScreenings(batchSize);
    
    // Send notifications for each successful screening
    results.forEach(result => {
      if (result.success) {
        sendScreeningNotification(result.result);
      }
    });
    
    res.status(200).json({
      success: true,
      processed: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    });
  } catch (error) {
    console.error('Error in batchProcessScreening controller:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process batch screening',
      error: error.message
    });
  }
};

exports.getScreeningResult = async (req, res) => {
  try {
    const { applicationId } = req.params;
    
    // Get application details including screening results
    const query = `
      SELECT 
        a.*,
        j.title as job_title,
        j.min_education_level,
        j.min_experience,
        j.requirements
      FROM job_applications a
      JOIN job_postings j ON a.job_id = j.id
      WHERE a.id = $1
    `;
    
    const dbClient = require('../config/db');
    const result = await dbClient.query(query, [applicationId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }
    
    const application = result.rows[0];
    
    // Check authorization to view this screening
    const isAuthorized = await checkScreeningAccess(req.user, application);
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this screening'
      });
    }
    
    // Format the result
    const screeningResult = {
      applicationId: application.id,
      jobId: application.job_id,
      jobTitle: application.job_title,
      score: application.screening_score,
      passed: application.passed_screening,
      status: application.status,
      screenedAt: application.screened_at,
      details: {
        requiredEducation: application.min_education_level,
        requiredExperience: application.min_experience
      }
    };
    
    res.status(200).json({
      success: true,
      data: screeningResult
    });
  } catch (error) {
    console.error('Error in getScreeningResult controller:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve screening result',
      error: error.message
    });
  }
};

/**
 * Verify that a user is authorized to screen an application
 * @private
 */
async function isAuthorizedToScreen(userId, applicationId) {
  try {
    const dbClient = require('../config/db');
    const query = `
      SELECT j.creator_id
      FROM job_applications a
      JOIN job_postings j ON a.job_id = j.id
      WHERE a.id = $1
    `;
    
    const result = await dbClient.query(query, [applicationId]);
    
    if (result.rows.length === 0) {
      return false;
    }
    
    return result.rows[0].creator_id === userId;
  } catch (error) {
    console.error('Error checking screening authorization:', error);
    return false;
  }
}

/**
 * Check if a user can access a screening result
 * @private
 */
async function checkScreeningAccess(user, application) {
  // Admin users can access all screenings
  if (user.accountType === 'admin') {
    return true;
  }
  
  // HR users can access screenings for jobs they created
  if (user.accountType === 'hr') {
    const dbClient = require('../config/db');
    const query = `
      SELECT creator_id 
      FROM job_postings 
      WHERE id = $1
    `;
    
    const result = await dbClient.query(query, [application.job_id]);
    
    if (result.rows.length === 0) {
      return false;
    }
    
    return result.rows[0].creator_id === user.id;
  }
  
  // Applicants can only access their own screenings
  if (user.accountType === 'applicant') {
    return application.applicant_id === user.id;
  }
  
  return false;
}

/**
 * Send notification emails based on screening results
 * @private
 */
async function sendScreeningNotification(screeningResult) {
  try {
    // Get applicant email and job details
    const dbClient = require('../config/db');
    const query = `
      SELECT 
        u.email as applicant_email,
        a.applicant_id,
        j.title as job_title,
        j.id as job_id,
        j.creator_id as hr_id,
        (SELECT email FROM users WHERE id = j.creator_id) as hr_email
      FROM job_applications a
      JOIN users u ON a.applicant_id = u.id
      JOIN job_postings j ON a.job_id = j.id
      WHERE a.id = $1
    `;
    
    const result = await dbClient.query(query, [screeningResult.applicationId]);
    
    if (result.rows.length === 0) {
      console.error('Could not find application details for notification');
      return;
    }
    
    const details = result.rows[0];
    
    // Send email to applicant
    if (details.applicant_email) {
      const applicantSubject = screeningResult.passed
        ? `Your application for ${details.job_title} is under review`
        : `Update on your application for ${details.job_title}`;
        
      const applicantMessage = screeningResult.passed
        ? `
          <h1>Your application is under review!</h1>
          <p>Congratulations! Your application for <strong>${details.job_title}</strong> has passed our initial screening process and is now under review by our HR team.</p>
          <p>Your screening score: <strong>${screeningResult.score}/100</strong></p>
          <p>We'll be in touch soon with next steps.</p>
        `
        : `
          <h1>Update on your application</h1>
          <p>Thank you for applying for <strong>${details.job_title}</strong>.</p>
          <p>After reviewing your qualifications, we've determined that your profile doesn't match the minimum requirements for this position.</p>
          <p>Your screening score: <strong>${screeningResult.score}/100</strong></p>
          <p>We encourage you to explore other opportunities that may better match your skills and experience.</p>
        `;
      
      await emailService({
        to: details.applicant_email,
        subject: applicantSubject,
        html: applicantMessage
      });
    }
    
    // Send email to HR staff if application passed screening
    if (screeningResult.passed && details.hr_email) {
      const hrMessage = `
        <h1>New Qualified Applicant</h1>
        <p>A new applicant has passed the screening for <strong>${details.job_title}</strong>.</p>
        <p>Screening score: <strong>${screeningResult.score}/100</strong></p>
        <p>View the application in your dashboard to review the candidate's qualifications.</p>
      `;
      
      await emailService({
        to: details.hr_email,
        subject: `New Qualified Applicant for ${details.job_title}`,
        html: hrMessage
      });
    }
  } catch (error) {
    console.error('Error sending screening notification:', error);
  }
}