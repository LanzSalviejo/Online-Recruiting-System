const pool = require('../config/db');

/**
 * JobApplication model for PostgreSQL
 * Uses Data Access Object (DAO) pattern
 */
const JobApplication = {
  /**
   * Find application by ID
   * @param {Number} id - Application ID
   * @returns {Promise<Object>} Job application
   */
  findById: async (id) => {
    try {
      const query = `
        SELECT a.*, 
          j.title as job_title, 
          j.company_name,
          u.first_name, 
          u.last_name, 
          u.email
        FROM job_applications a
        JOIN job_postings j ON a.job_id = j.id
        JOIN users u ON a.applicant_id = u.id
        WHERE a.id = $1
      `;
      
      const result = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const application = result.rows[0];
      return {
        _id: application.id,
        jobId: application.job_id,
        applicantId: application.applicant_id,
        jobTitle: application.job_title,
        companyName: application.company_name,
        applicantName: `${application.first_name} ${application.last_name}`,
        applicantEmail: application.email,
        applicationDate: application.application_date,
        coverLetter: application.cover_letter,
        resumePath: application.resume_path,
        status: application.status,
        screeningScore: application.screening_score,
        passedScreening: application.passed_screening,
        notes: application.notes
      };
    } catch (error) {
      console.error('Error in JobApplication.findById:', error);
      throw error;
    }
  },
  
  /**
   * Find applications by job ID
   * @param {Number} jobId - Job ID
   * @returns {Promise<Array>} Job applications
   */
  findByJobId: async (jobId) => {
    try {
      const query = `
        SELECT a.*, 
          u.first_name, 
          u.last_name, 
          u.email
        FROM job_applications a
        JOIN users u ON a.applicant_id = u.id
        WHERE a.job_id = $1
        ORDER BY a.application_date DESC
      `;
      
      const result = await pool.query(query, [jobId]);
      
      return result.rows.map(application => ({
        _id: application.id,
        jobId: application.job_id,
        applicantId: application.applicant_id,
        applicantName: `${application.first_name} ${application.last_name}`,
        applicantEmail: application.email,
        applicationDate: application.application_date,
        coverLetter: application.cover_letter,
        resumePath: application.resume_path,
        status: application.status,
        screeningScore: application.screening_score,
        passedScreening: application.passed_screening,
        notes: application.notes
      }));
    } catch (error) {
      console.error('Error in JobApplication.findByJobId:', error);
      throw error;
    }
  },
  
  /**
   * Find applications by applicant ID
   * @param {Number} applicantId - Applicant ID
   * @returns {Promise<Array>} Job applications
   */
  findByApplicantId: async (applicantId) => {
    try {
      const query = `
        SELECT a.*, 
          j.title as job_title, 
          j.company_name,
          j.location,
          j.position_type
        FROM job_applications a
        JOIN job_postings j ON a.job_id = j.id
        WHERE a.applicant_id = $1
        ORDER BY a.application_date DESC
      `;
      
      const result = await pool.query(query, [applicantId]);
      
      return result.rows.map(application => ({
        _id: application.id,
        jobId: application.job_id,
        jobTitle: application.job_title,
        companyName: application.company_name,
        location: application.location,
        positionType: application.position_type,
        applicationDate: application.application_date,
        status: application.status,
        passedScreening: application.passed_screening
      }));
    } catch (error) {
      console.error('Error in JobApplication.findByApplicantId:', error);
      throw error;
    }
  },
  
  /**
   * Create a new job application
   * @param {Object} applicationData - Application data
   * @returns {Promise<Object>} Created application
   */
  create: async (applicationData) => {
    try {
      const {
        jobId,
        applicantId,
        coverLetter,
        resumePath
      } = applicationData;
      
      // Check if application already exists
      const checkQuery = `
        SELECT id FROM job_applications 
        WHERE job_id = $1 AND applicant_id = $2
      `;
      
      const checkResult = await pool.query(checkQuery, [jobId, applicantId]);
      
      if (checkResult.rows.length > 0) {
        throw new Error('You have already applied for this job');
      }
      
      const query = `
        INSERT INTO job_applications (
          job_id,
          applicant_id,
          application_date,
          cover_letter,
          resume_path,
          status,
          passed_screening
        ) VALUES ($1, $2, CURRENT_DATE, $3, $4, 'Pending', false)
        RETURNING *
      `;
      
      const values = [
        jobId,
        applicantId,
        coverLetter || '',
        resumePath || ''
      ];
      
      const result = await pool.query(query, values);
      
      // Get job and applicant details for response
      const detailsQuery = `
        SELECT 
          j.title as job_title, 
          j.company_name,
          u.first_name, 
          u.last_name
        FROM job_postings j, users u
        WHERE j.id = $1 AND u.id = $2
      `;
      
      const detailsResult = await pool.query(detailsQuery, [jobId, applicantId]);
      
      const application = result.rows[0];
      const details = detailsResult.rows[0];
      
      return {
        _id: application.id,
        jobId: application.job_id,
        applicantId: application.applicant_id,
        jobTitle: details?.job_title,
        companyName: details?.company_name,
        applicantName: details ? `${details.first_name} ${details.last_name}` : null,
        applicationDate: application.application_date,
        status: application.status,
        passedScreening: application.passed_screening
      };
    } catch (error) {
      console.error('Error in JobApplication.create:', error);
      throw error;
    }
  },
  
  /**
   * Update application status
   * @param {Number} id - Application ID
   * @param {String} status - New status
   * @param {String} notes - Optional notes
   * @returns {Promise<Object>} Updated application
   */
  updateStatus: async (id, status, notes = null) => {
    try {
      const validStatuses = ['Pending', 'Screened Out', 'Under Review', 'Interview', 'Offer', 'Rejected', 'Accepted'];
      
      if (!validStatuses.includes(status)) {
        throw new Error('Invalid status value');
      }
      
      const query = `
        UPDATE job_applications
        SET status = $1, notes = COALESCE($2, notes)
        WHERE id = $3
        RETURNING *
      `;
      
      const result = await pool.query(query, [status, notes, id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      // Get job and applicant details
      const detailsQuery = `
        SELECT 
          j.title as job_title, 
          j.company_name,
          u.first_name, 
          u.last_name,
          u.email
        FROM job_applications a
        JOIN job_postings j ON a.job_id = j.id
        JOIN users u ON a.applicant_id = u.id
        WHERE a.id = $1
      `;
      
      const detailsResult = await pool.query(detailsQuery, [id]);
      const details = detailsResult.rows[0];
      const application = result.rows[0];
      
      return {
        _id: application.id,
        jobId: application.job_id,
        applicantId: application.applicant_id,
        jobTitle: details?.job_title,
        companyName: details?.company_name,
        applicantName: details ? `${details.first_name} ${details.last_name}` : null,
        applicantEmail: details?.email,
        applicationDate: application.application_date,
        status: application.status,
        screeningScore: application.screening_score,
        passedScreening: application.passed_screening,
        notes: application.notes
      };
    } catch (error) {
      console.error('Error in JobApplication.updateStatus:', error);
      throw error;
    }
  },
  
  /**
   * Update screening results
   * @param {Number} id - Application ID
   * @param {Object} screeningData - Screening data
   * @returns {Promise<Object>} Updated application
   */
  updateScreening: async (id, screeningData) => {
    try {
      const { score, passed, notes = null } = screeningData;
      
      const query = `
        UPDATE job_applications
        SET 
          screening_score = $1, 
          passed_screening = $2, 
          notes = COALESCE($3, notes),
          status = CASE WHEN $2 THEN 'Under Review' ELSE 'Screened Out' END
        WHERE id = $4
        RETURNING *
      `;
      
      const result = await pool.query(query, [score, passed, notes, id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const application = result.rows[0];
      
      // Get additional details for notification
      const detailsQuery = `
        SELECT 
          j.title as job_title, 
          j.company_name,
          u.first_name, 
          u.last_name,
          u.email
        FROM job_applications a
        JOIN job_postings j ON a.job_id = j.id
        JOIN users u ON a.applicant_id = u.id
        WHERE a.id = $1
      `;
      
      const detailsResult = await pool.query(detailsQuery, [id]);
      const details = detailsResult.rows[0] || {};
      
      return {
        _id: application.id,
        jobId: application.job_id,
        applicantId: application.applicant_id,
        jobTitle: details.job_title,
        companyName: details.company_name,
        applicantName: `${details.first_name} ${details.last_name}`,
        applicantEmail: details.email,
        applicationDate: application.application_date,
        status: application.status,
        screeningScore: application.screening_score,
        passedScreening: application.passed_screening,
        notes: application.notes
      };
    } catch (error) {
      console.error('Error in JobApplication.updateScreening:', error);
      throw error;
    }
  },
  
  /**
   * Count applications by status
   * @param {Number} jobId - Job ID (optional)
   * @returns {Promise<Object>} Counts by status
   */
  countByStatus: async (jobId = null) => {
    try {
      let query = `
        SELECT 
          status, 
          COUNT(*) as count
        FROM job_applications
      `;
      
      const params = [];
      
      if (jobId) {
        query += ' WHERE job_id = $1';
        params.push(jobId);
      }
      
      query += ' GROUP BY status';
      
      const result = await pool.query(query, params);
      
      // Convert to object with status as keys
      const counts = {
        'Pending': 0,
        'Screened Out': 0,
        'Under Review': 0,
        'Interview': 0,
        'Offer': 0,
        'Rejected': 0,
        'Accepted': 0
      };
      
      result.rows.forEach(row => {
        counts[row.status] = parseInt(row.count);
      });
      
      return counts;
    } catch (error) {
      console.error('Error in JobApplication.countByStatus:', error);
      throw error;
    }
  },
  
  /**
   * Get applicant stats
   * @param {Number} applicantId - Applicant ID
   * @returns {Promise<Object>} Application statistics
   */
  getApplicantStats: async (applicantId) => {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_applications,
          COUNT(CASE WHEN status IN ('Pending', 'Under Review') THEN 1 END) as pending_applications,
          COUNT(CASE WHEN status = 'Interview' THEN 1 END) as interview_invitations,
          COUNT(CASE WHEN status = 'Rejected' THEN 1 END) as rejected_applications,
          COUNT(CASE WHEN status = 'Offer' THEN 1 END) as offers,
          COUNT(CASE WHEN status = 'Accepted' THEN 1 END) as accepted_offers
        FROM job_applications
        WHERE applicant_id = $1
      `;
      
      const result = await pool.query(query, [applicantId]);
      
      // Format result
      const stats = result.rows[0];
      return {
        totalApplications: parseInt(stats.total_applications),
        pendingApplications: parseInt(stats.pending_applications),
        interviewInvitations: parseInt(stats.interview_invitations),
        rejectedApplications: parseInt(stats.rejected_applications),
        offers: parseInt(stats.offers),
        acceptedOffers: parseInt(stats.accepted_offers)
      };
    } catch (error) {
      console.error('Error in JobApplication.getApplicantStats:', error);
      throw error;
    }
  },
  
  /**
   * Get HR staff stats
   * @param {Number} hrId - HR staff ID
   * @returns {Promise<Object>} HR-related statistics
   */
  getHRStats: async (hrId) => {
    try {
      const query = `
        SELECT 
          COUNT(DISTINCT j.id) as active_jobs,
          COUNT(a.id) as total_applications,
          COUNT(CASE WHEN a.status IN ('Pending', 'New') THEN 1 END) as new_applications,
          COUNT(CASE WHEN a.status = 'Interview' THEN 1 END) as interview_scheduled
        FROM job_postings j
        LEFT JOIN job_applications a ON j.id = a.job_id
        WHERE j.creator_id = $1 AND j.is_active = true
      `;
      
      const result = await pool.query(query, [hrId]);
      
      // Format result
      const stats = result.rows[0];
      return {
        activeJobs: parseInt(stats.active_jobs),
        totalApplications: parseInt(stats.total_applications),
        newApplications: parseInt(stats.new_applications),
        interviewScheduled: parseInt(stats.interview_scheduled)
      };
    } catch (error) {
      console.error('Error in JobApplication.getHRStats:', error);
      throw error;
    }
  }
};

module.exports = JobApplication;