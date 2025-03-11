const pool = require('../config/db');
const emailService = require('../utils/sendEmail');

/**
 * Service for job matching and notifications
 */
class JobMatchingService {
  /**
   * Find matching applicants for a specific job posting
   * @param {number} jobId - Job posting ID
   * @returns {Promise<Array>} - Array of matching applicants with scores
   */
  async findMatchingApplicants(jobId) {
    try {
      // Get job posting details
      const jobQuery = `
        SELECT 
          j.*,
          c.name as category_name
        FROM job_postings j
        LEFT JOIN job_categories c ON j.category_id = c.id
        WHERE j.id = $1
      `;
      
      const jobResult = await pool.query(jobQuery, [jobId]);
      
      if (jobResult.rows.length === 0) {
        throw new Error('Job posting not found');
      }
      
      const job = jobResult.rows[0];
      
      // Find applicants with matching preferences
      const matchQuery = `
        SELECT 
          jp.user_id,
          u.email,
          u.first_name,
          u.last_name,
          jp.category,
          jp.position_type,
          jp.location,
          jp.min_salary,
          (
            CASE 
              WHEN LOWER(jp.category) = LOWER($1) THEN 1.0 
              ELSE 0.5 
            END +
            CASE 
              WHEN jp.position_type = $2 THEN 1.0 
              ELSE 0.0 
            END +
            CASE 
              WHEN LOWER(jp.location) = LOWER($3) THEN 1.0 
              WHEN jp.location ILIKE '%' || $3 || '%' OR $3 ILIKE '%' || jp.location || '%' THEN 0.5
              ELSE 0.0 
            END +
            CASE 
              WHEN $4 >= jp.min_salary THEN 1.0 
              WHEN $4 >= (jp.min_salary * 0.9) THEN 0.5
              ELSE 0.0 
            END
          ) as match_score
        FROM job_preferences jp
        JOIN users u ON jp.user_id = u.id
        WHERE u.is_active = true 
          AND u.account_type = 'applicant'
          AND u.is_verified = true
      `;
      
      const params = [
        job.category_name || '',
        job.position_type || '',
        job.location || '',
        job.salary || 0
      ];
      
      const matchResult = await pool.query(matchQuery, params);
      
      // Filter to get only high matches (score >= 2.0) and format result
      return matchResult.rows
        .filter(match => match.match_score >= 2.0)
        .map(match => ({
          userId: match.user_id,
          email: match.email,
          firstName: match.first_name,
          lastName: match.last_name,
          matchScore: Math.round(match.match_score * 25), // Convert to percentage (max score is 4.0)
          matchDetails: {
            categoryMatch: match.category.toLowerCase() === job.category_name.toLowerCase(),
            positionTypeMatch: match.position_type === job.position_type,
            locationMatch: match.location.toLowerCase() === job.location.toLowerCase() || 
                          match.location.toLowerCase().includes(job.location.toLowerCase()) || 
                          job.location.toLowerCase().includes(match.location.toLowerCase()),
            salaryMatch: job.salary >= match.min_salary
          }
        }))
        .sort((a, b) => b.matchScore - a.matchScore);
    } catch (error) {
      console.error('Error finding matching applicants:', error);
      throw error;
    }
  }
  
  /**
   * Send job match notifications to matching applicants
   * @param {number} jobId - Job posting ID
   * @returns {Promise<Object>} - Notification results
   */
  async sendJobMatchNotifications(jobId) {
    try {
      // Get job posting details
      const jobQuery = `
        SELECT 
          j.*,
          c.name as category_name
        FROM job_postings j
        LEFT JOIN job_categories c ON j.category_id = c.id
        WHERE j.id = $1
      `;
      
      const jobResult = await pool.query(jobQuery, [jobId]);
      
      if (jobResult.rows.length === 0) {
        throw new Error('Job posting not found');
      }
      
      const job = jobResult.rows[0];
      
      // Find matching applicants
      const matchingApplicants = await this.findMatchingApplicants(jobId);
      
      // Send notifications to each matching applicant
      const notificationResults = [];
      
      for (const applicant of matchingApplicants) {
        try {
          // Create notification record in database
          const notificationQuery = `
            INSERT INTO notifications (
              user_id,
              typen,
              title,
              messageData,
              related_id,
              is_read,
              created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
            RETURNING id
          `;
          
          const notificationParams = [
            applicant.userId,
            'job_match',
            `New Job Match: ${job.title}`,
            `We found a job that matches your preferences: ${job.title} at ${job.company_name || 'Company'} (${applicant.matchScore}% match)`,
            jobId,
            false
          ];
          
          const notificationResult = await pool.query(notificationQuery, notificationParams);
          const notificationId = notificationResult.rows[0]?.id;
          
          // Send email notification
          const emailSubject = `New Job Match: ${job.title}`;
          const emailHtml = `
            <h1>We found a job that matches your preferences!</h1>
            <p>Hello ${applicant.firstName},</p>
            <p>A new job posting that matches your preferences is now available:</p>
            <div style="margin: 20px 0; padding: 15px; border: 1px solid #e0e0e0; border-radius: 5px;">
              <h2 style="color: #2563eb; margin-top: 0;">${job.title}</h2>
              <p><strong>Company:</strong> ${job.company_name || 'Company'}</p>
              <p><strong>Location:</strong> ${job.location}</p>
              <p><strong>Position Type:</strong> ${job.position_type}</p>
              <p><strong>Match Score:</strong> ${applicant.matchScore}%</p>
              ${job.salary ? `<p><strong>Salary:</strong> $${job.salary.toLocaleString()}</p>` : ''}
            </div>
            <p><strong>Why we think this is a good match for you:</strong></p>
            <ul>
              ${applicant.matchDetails.categoryMatch ? `<li>This job is in the ${job.category_name} category that you're interested in.</li>` : ''}
              ${applicant.matchDetails.positionTypeMatch ? `<li>This is a ${job.position_type} position, which matches your preference.</li>` : ''}
              ${applicant.matchDetails.locationMatch ? `<li>The job location (${job.location}) matches your preferred location.</li>` : ''}
              ${applicant.matchDetails.salaryMatch ? `<li>The salary meets or exceeds your minimum salary requirement.</li>` : ''}
            </ul>
            <p>View the job details and apply by visiting: <a href="${process.env.FRONTEND_URL}/jobs/${jobId}">Job Details</a></p>
            <p>Good luck with your application!</p>
          `;
          
          await emailService({
            to: applicant.email,
            subject: emailSubject,
            html: emailHtml
          });
          
          notificationResults.push({
            userId: applicant.userId,
            email: applicant.email,
            notificationId,
            success: true
          });
        } catch (error) {
          console.error(`Error sending notification to user ${applicant.userId}:`, error);
          
          notificationResults.push({
            userId: applicant.userId,
            email: applicant.email,
            success: false,
            error: error.message
          });
        }
      }
      
      return {
        jobId,
        totalMatches: matchingApplicants.length,
        notificationsSent: notificationResults.filter(r => r.success).length,
        notificationsFailed: notificationResults.filter(r => !r.success).length,
        results: notificationResults
      };
    } catch (error) {
      console.error('Error sending job match notifications:', error);
      throw error;
    }
  }
  
  /**
   * Check for job matches for a specific user
   * @param {number} userId - User ID
   * @returns {Promise<Array>} - Array of matching jobs
   */
  async findMatchingJobsForUser(userId) {
    try {
      // Get user preferences
      const prefsQuery = `
        SELECT * FROM job_preferences
        WHERE user_id = $1
      `;
      
      const prefsResult = await pool.query(prefsQuery, [userId]);
      
      if (prefsResult.rows.length === 0) {
        return []; // No preferences set, no matches
      }
      
      const preferences = prefsResult.rows;
      
      // Get active job postings that match user preferences
      const jobsQuery = `
        SELECT 
          j.*,
          c.name as category_name,
          (
            CASE 
              WHEN LOWER(c.name) = LOWER($1) THEN 1.0 
              ELSE 0.5 
            END +
            CASE 
              WHEN j.position_type = $2 THEN 1.0 
              ELSE 0.0 
            END +
            CASE 
              WHEN LOWER(j.location) = LOWER($3) THEN 1.0 
              WHEN j.location ILIKE '%' || $3 || '%' OR $3 ILIKE '%' || j.location || '%' THEN 0.5
              ELSE 0.0 
            END +
            CASE 
              WHEN j.salary >= $4 THEN 1.0 
              WHEN j.salary >= ($4 * 0.9) THEN 0.5
              ELSE 0.0 
            END
          ) as match_score
        FROM job_postings j
        LEFT JOIN job_categories c ON j.category_id = c.id
        WHERE j.is_active = true 
          AND j.due_date >= CURRENT_DATE
      `;
      
      // Use the first preference for simplicity (in a more complex system, we'd aggregate across all preferences)
      const pref = preferences[0];
      const params = [
        pref.category || '',
        pref.position_type || '',
        pref.location || '',
        pref.min_salary || 0
      ];
      
      const jobsResult = await pool.query(jobsQuery, params);
      
      // Filter to get only high matches (score >= 2.0)
      return jobsResult.rows
        .filter(job => job.match_score >= 2.0)
        .map(job => ({
          jobId: job.id,
          title: job.title,
          companyName: job.company_name,
          location: job.location,
          positionType: job.position_type,
          categoryName: job.category_name,
          salary: job.salary,
          dueDate: job.due_date,
          matchScore: Math.round(job.match_score * 25), // Convert to percentage (max score is 4.0)
          matchDetails: {
            categoryMatch: job.category_name.toLowerCase() === pref.category.toLowerCase(),
            positionTypeMatch: job.position_type === pref.position_type,
            locationMatch: job.location.toLowerCase() === pref.location.toLowerCase() || 
                        job.location.toLowerCase().includes(pref.location.toLowerCase()) || 
                        pref.location.toLowerCase().includes(job.location.toLowerCase()),
            salaryMatch: job.salary >= pref.min_salary
          }
        }))
        .sort((a, b) => b.matchScore - a.matchScore);
    } catch (error) {
      console.error('Error finding matching jobs for user:', error);
      throw error;
    }
  }
  
  /**
   * Process job matching for a newly created job
   * @param {number} jobId - Job posting ID
   * @returns {Promise<Object>} - Matching and notification results
   */
  async processNewJobMatching(jobId) {
    try {
      // Validation
      if (!jobId) {
        throw new Error('Job ID is required');
      }
      
      // Find matching applicants
      const matchingApplicants = await this.findMatchingApplicants(jobId);
      
      // If there are matches, send notifications
      if (matchingApplicants.length > 0) {
        return await this.sendJobMatchNotifications(jobId);
      } else {
        return {
          jobId,
          totalMatches: 0,
          notificationsSent: 0,
          notificationsFailed: 0,
          results: []
        };
      }
    } catch (error) {
      console.error('Error processing new job matching:', error);
      throw error;
    }
  }
  
  /**
   * Process job matching for a newly created preference
   * @param {number} userId - User ID
   * @param {number} preferenceId - Preference ID
   * @returns {Promise<Array>} - Array of matching jobs
   */
  async processNewPreferenceMatching(userId, preferenceId) {
    try {
      // Validation
      if (!userId) {
        throw new Error('User ID is required');
      }
      
      // Find matching jobs for the user
      const matchingJobs = await this.findMatchingJobsForUser(userId);
      
      // Insert notifications for each matching job
      const notificationResults = [];
      
      for (const job of matchingJobs) {
        try {
          // Check if we already notified this user about this job
          const existingNotificationQuery = `
            SELECT id FROM notifications
            WHERE user_id = $1 AND related_id = $2 AND type = 'job_match'
          `;
          
          const existingResult = await pool.query(existingNotificationQuery, [userId, job.jobId]);
          
          if (existingResult.rows.length > 0) {
            // Already notified, skip
            continue;
          }
          
          // Create notification record in database
          const notificationQuery = `
            INSERT INTO notifications (
              user_id,
              typen,
              title,
              messageData,
              related_id,
              is_read,
              created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
            RETURNING id
          `;
          
          const notificationParams = [
            userId,
            'job_match',
            `Job Match Found: ${job.title}`,
            `We found a job that matches your preferences: ${job.title} at ${job.companyName} (${job.matchScore}% match)`,
            job.jobId,
            false
          ];
          
          const notificationResult = await pool.query(notificationQuery, notificationParams);
          const notificationId = notificationResult.rows[0]?.id;
          
          notificationResults.push({
            jobId: job.jobId,
            notificationId,
            success: true
          });
        } catch (error) {
          console.error(`Error creating notification for job ${job.jobId}:`, error);
          
          notificationResults.push({
            jobId: job.jobId,
            success: false,
            error: error.message
          });
        }
      }
      
      // Get user email for sending notifications
      const userQuery = `
        SELECT email, first_name
        FROM users
        WHERE id = $1
      `;
      
      const userResult = await pool.query(userQuery, [userId]);
      
      if (userResult.rows.length > 0) {
        const user = userResult.rows[0];
        
        // Send email notification about matches if there are any
        if (matchingJobs.length > 0) {
          const topMatches = matchingJobs.slice(0, 5); // Get top 5 matches
          
          const emailSubject = `We found ${matchingJobs.length} job matches for you!`;
          const emailHtml = `
            <h1>Job Matches Based on Your Preferences</h1>
            <p>Hello ${user.first_name},</p>
            <p>Based on your job preferences, we've found ${matchingJobs.length} jobs that might interest you:</p>
            ${topMatches.map(job => `
              <div style="margin: 20px 0; padding: 15px; border: 1px solid #e0e0e0; border-radius: 5px;">
                <h2 style="color: #2563eb; margin-top: 0;">${job.title}</h2>
                <p><strong>Company:</strong> ${job.companyName}</p>
                <p><strong>Location:</strong> ${job.location}</p>
                <p><strong>Position Type:</strong> ${job.positionType}</p>
                <p><strong>Match Score:</strong> ${job.matchScore}%</p>
                ${job.salary ? `<p><strong>Salary:</strong> $${job.salary.toLocaleString()}</p>` : ''}
                <p><a href="${process.env.FRONTEND_URL}/jobs/${job.jobId}" style="display: inline-block; padding: 8px 16px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 4px;">View Details</a></p>
              </div>
            `).join('')}
            ${matchingJobs.length > 5 ? `<p>...and ${matchingJobs.length - 5} more matches!</p>` : ''}
            <p>View all your job matches by visiting your <a href="${process.env.FRONTEND_URL}/dashboard">dashboard</a>.</p>
            <p>Good luck with your job search!</p>
          `;
          
          await emailService({
            to: user.email,
            subject: emailSubject,
            html: emailHtml
          });
        }
      }
      
      return {
        userId,
        preferenceId,
        totalMatches: matchingJobs.length,
        notificationsCreated: notificationResults.filter(r => r.success).length,
        matchingJobs
      };
    } catch (error) {
      console.error('Error processing new preference matching:', error);
      throw error;
    }
  }
}

module.exports = new JobMatchingService();