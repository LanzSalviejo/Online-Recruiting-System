const pool = require('../config/db');
const path = require('path');
const fs = require('fs');

/**
 * Get personal information
 * @route GET /api/profile/personal-info
 * @access Private
 */
exports.getPersonalInfo = async (req, res) => {
  try {
    const userId = req.user.id;

    // Query based on account type
    let query = '';
    if (req.user.accountType === 'applicant') {
      query = `
        SELECT u.first_name AS "firstName", u.last_name AS "lastName", 
               u.email, u.image_path AS "imagePath", a.phone_number AS "phoneNumber", 
               a.date_of_birth AS "dateOfBirth", a.street, a.city, a.postal_code AS "postalCode"
        FROM users u
        LEFT JOIN applicants a ON u.id = a.user_id
        WHERE u.id = $1
      `;
    } else if (req.user.accountType === 'hr') {
      query = `
        SELECT u.first_name AS "firstName", u.last_name AS "lastName", 
               u.email, u.image_path AS "imagePath", h.phone_number AS "phoneNumber", 
               h.working_id AS "workingId", h.company_name AS "companyName"
        FROM users u
        LEFT JOIN hr_staff h ON u.id = h.user_id
        WHERE u.id = $1
      `;
    } else {
      query = `
        SELECT first_name AS "firstName", last_name AS "lastName", 
               email, image_path AS "imagePath"
        FROM users
        WHERE id = $1
      `;
    }

    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching personal info:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Update personal information
 * @route PUT /api/profile/personal-info
 * @access Private
 */
exports.updatePersonalInfo = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      firstName,
      lastName,
      phoneNumber,
      dateOfBirth,
      street,
      city,
      postalCode,
      companyName
    } = req.body;

    // Start a transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update users table
      const updateUserQuery = `
        UPDATE users
        SET first_name = $1, last_name = $2
        WHERE id = $3
        RETURNING *
      `;
      await client.query(updateUserQuery, [firstName, lastName, userId]);

      // Update profile-specific tables based on account type
      if (req.user.accountType === 'applicant') {
        // Check if applicant profile exists
        const checkApplicantQuery = `
          SELECT * FROM applicants WHERE user_id = $1
        `;
        const checkResult = await client.query(checkApplicantQuery, [userId]);

        if (checkResult.rows.length > 0) {
          // Update existing profile
          const updateApplicantQuery = `
            UPDATE applicants
            SET phone_number = $1, date_of_birth = $2, street = $3, city = $4, postal_code = $5
            WHERE user_id = $6
          `;
          await client.query(updateApplicantQuery, [phoneNumber, dateOfBirth, street, city, postalCode, userId]);
        } else {
          // Create new profile
          const insertApplicantQuery = `
            INSERT INTO applicants (user_id, phone_number, date_of_birth, street, city, postal_code)
            VALUES ($1, $2, $3, $4, $5, $6)
          `;
          await client.query(insertApplicantQuery, [userId, phoneNumber, dateOfBirth, street, city, postalCode]);
        }
      } else if (req.user.accountType === 'hr') {
        // Check if HR profile exists
        const checkHRQuery = `
          SELECT * FROM hr_staff WHERE user_id = $1
        `;
        const checkResult = await client.query(checkHRQuery, [userId]);

        if (checkResult.rows.length > 0) {
          // Update existing profile
          const updateHRQuery = `
            UPDATE hr_staff
            SET phone_number = $1, company_name = $2
            WHERE user_id = $3
          `;
          await client.query(updateHRQuery, [phoneNumber, companyName, userId]);
        } else {
          // Create new profile (unlikely scenario but handled for completeness)
          const insertHRQuery = `
            INSERT INTO hr_staff (user_id, phone_number, company_name)
            VALUES ($1, $2, $3)
          `;
          await client.query(insertHRQuery, [userId, phoneNumber, companyName]);
        }
      }

      await client.query('COMMIT');

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating personal info:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Upload profile image
 * @route POST /api/profile/image
 * @access Private
 */
exports.uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const userId = req.user.id;
    
    // Generate relative path for storage
    const imagePath = `/uploads/profile-images/${req.file.filename}`;
    
    // Update user's image path in database
    const updateQuery = `
      UPDATE users
      SET image_path = $1
      WHERE id = $2
      RETURNING image_path AS "imagePath"
    `;
    
    const result = await pool.query(updateQuery, [imagePath, userId]);
    
    res.status(200).json({
      success: true,
      message: 'Profile image uploaded successfully',
      data: {
        imagePath: result.rows[0].imagePath
      }
    });
  } catch (error) {
    console.error('Error uploading profile image:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Education Controller Methods

/**
 * Get all education records for a user
 * @route GET /api/profile/education
 * @access Private
 */
exports.getEducation = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const query = `
      SELECT education_id AS id, degree_level AS "degreeLevel", field_of_study AS "fieldOfStudy",
             institution, start_date AS "startDate", end_date AS "endDate", gpa
      FROM education
      WHERE user_id = $1
      ORDER BY end_date DESC
    `;
    
    const result = await pool.query(query, [userId]);
    
    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching education records:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Get a specific education record
 * @route GET /api/profile/education/:id
 * @access Private
 */
exports.getEducationById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const query = `
      SELECT education_id AS id, degree_level AS "degreeLevel", field_of_study AS "fieldOfStudy",
             institution, start_date AS "startDate", end_date AS "endDate", gpa
      FROM education
      WHERE education_id = $1 AND user_id = $2
    `;
    
    const result = await pool.query(query, [id, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Education record not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching education record:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Add a new education record
 * @route POST /api/profile/education
 * @access Private
 */
exports.addEducation = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      degreeLevel,
      fieldOfStudy,
      institution,
      startDate,
      endDate,
      gpa
    } = req.body;
    
    const query = `
      INSERT INTO education (
        user_id, degree_level, field_of_study, institution, start_date, end_date, gpa
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING education_id AS id, degree_level AS "degreeLevel", field_of_study AS "fieldOfStudy",
                institution, start_date AS "startDate", end_date AS "endDate", gpa
    `;
    
    const result = await pool.query(query, [
      userId, degreeLevel, fieldOfStudy, institution, startDate, endDate, gpa
    ]);
    
    res.status(201).json({
      success: true,
      message: 'Education added successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error adding education:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Update an education record
 * @route PUT /api/profile/education/:id
 * @access Private
 */
exports.updateEducation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const {
      degreeLevel,
      fieldOfStudy,
      institution,
      startDate,
      endDate,
      gpa
    } = req.body;
    
    // Check if record exists and belongs to user
    const checkQuery = `
      SELECT * FROM education
      WHERE education_id = $1 AND user_id = $2
    `;
    
    const checkResult = await pool.query(checkQuery, [id, userId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Education record not found or not authorized'
      });
    }
    
    const updateQuery = `
      UPDATE education
      SET degree_level = $1, field_of_study = $2, institution = $3,
          start_date = $4, end_date = $5, gpa = $6
      WHERE education_id = $7 AND user_id = $8
      RETURNING education_id AS id, degree_level AS "degreeLevel", field_of_study AS "fieldOfStudy",
                institution, start_date AS "startDate", end_date AS "endDate", gpa
    `;
    
    const result = await pool.query(updateQuery, [
      degreeLevel, fieldOfStudy, institution, startDate, endDate, gpa, id, userId
    ]);
    
    res.status(200).json({
      success: true,
      message: 'Education updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating education:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Delete an education record
 * @route DELETE /api/profile/education/:id
 * @access Private
 */
exports.deleteEducation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if record exists and belongs to user
    const checkQuery = `
      SELECT * FROM education
      WHERE education_id = $1 AND user_id = $2
    `;
    
    const checkResult = await pool.query(checkQuery, [id, userId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Education record not found or not authorized'
      });
    }
    
    const deleteQuery = `
      DELETE FROM education
      WHERE education_id = $1 AND user_id = $2
      RETURNING education_id AS id
    `;
    
    await pool.query(deleteQuery, [id, userId]);
    
    res.status(200).json({
      success: true,
      message: 'Education deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting education:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Work Experience Controller Methods

/**
 * Get all work experience for a user
 * @route GET /api/profile/experience
 * @access Private
 */
exports.getWorkExperience = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const query = `
      SELECT experience_id AS id, job_title AS "jobTitle", company, industry,
             start_date AS "startDate", end_date AS "endDate", current_job AS "currentJob",
             responsibilities, skills
      FROM work_experience
      WHERE user_id = $1
      ORDER BY CASE WHEN current_job THEN 1 ELSE 0 END DESC, start_date DESC
    `;
    
    const result = await pool.query(query, [userId]);
    
    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching work experience:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Get a specific work experience record
 * @route GET /api/profile/experience/:id
 * @access Private
 */
exports.getWorkExperienceById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const query = `
      SELECT experience_id AS id, job_title AS "jobTitle", company, industry,
             start_date AS "startDate", end_date AS "endDate", current_job AS "currentJob",
             responsibilities, skills
      FROM work_experience
      WHERE experience_id = $1 AND user_id = $2
    `;
    
    const result = await pool.query(query, [id, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Work experience record not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching work experience record:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Add a new work experience record
 * @route POST /api/profile/experience
 * @access Private
 */
exports.addWorkExperience = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      jobTitle,
      company,
      industry,
      startDate,
      endDate,
      currentJob,
      responsibilities,
      skills
    } = req.body;
    
    // If current job is true, set end_date to null
    const finalEndDate = currentJob ? null : endDate;
    
    const query = `
      INSERT INTO work_experience (
        user_id, job_title, company, industry, start_date, end_date,
        current_job, responsibilities, skills
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING experience_id AS id, job_title AS "jobTitle", company, industry,
                start_date AS "startDate", end_date AS "endDate", current_job AS "currentJob",
                responsibilities, skills
    `;
    
    const result = await pool.query(query, [
      userId, jobTitle, company, industry, startDate, finalEndDate,
      currentJob, responsibilities, skills
    ]);
    
    res.status(201).json({
      success: true,
      message: 'Work experience added successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error adding work experience:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Update a work experience record
 * @route PUT /api/profile/experience/:id
 * @access Private
 */
exports.updateWorkExperience = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const {
      jobTitle,
      company,
      industry,
      startDate,
      endDate,
      currentJob,
      responsibilities,
      skills
    } = req.body;
    
    // Check if record exists and belongs to user
    const checkQuery = `
      SELECT * FROM work_experience
      WHERE experience_id = $1 AND user_id = $2
    `;
    
    const checkResult = await pool.query(checkQuery, [id, userId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Work experience record not found or not authorized'
      });
    }
    
    // If current job is true, set end_date to null
    const finalEndDate = currentJob ? null : endDate;
    
    const updateQuery = `
      UPDATE work_experience
      SET job_title = $1, company = $2, industry = $3, start_date = $4, 
          end_date = $5, current_job = $6, responsibilities = $7, skills = $8
      WHERE experience_id = $9 AND user_id = $10
      RETURNING experience_id AS id, job_title AS "jobTitle", company, industry,
                start_date AS "startDate", end_date AS "endDate", current_job AS "currentJob",
                responsibilities, skills
    `;
    
    const result = await pool.query(updateQuery, [
      jobTitle, company, industry, startDate, finalEndDate,
      currentJob, responsibilities, skills, id, userId
    ]);
    
    res.status(200).json({
      success: true,
      message: 'Work experience updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating work experience:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Delete a work experience record
 * @route DELETE /api/profile/experience/:id
 * @access Private
 */
exports.deleteWorkExperience = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if record exists and belongs to user
    const checkQuery = `
      SELECT * FROM work_experience
      WHERE experience_id = $1 AND user_id = $2
    `;
    
    const checkResult = await pool.query(checkQuery, [id, userId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Work experience record not found or not authorized'
      });
    }
    
    const deleteQuery = `
      DELETE FROM work_experience
      WHERE experience_id = $1 AND user_id = $2
      RETURNING experience_id AS id
    `;
    
    await pool.query(deleteQuery, [id, userId]);
    
    res.status(200).json({
      success: true,
      message: 'Work experience deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting work experience:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Job Preferences Controller Methods

/**
 * Get all job preferences for a user
 * @route GET /api/profile/preferences
 * @access Private
 */
exports.getJobPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const query = `
      SELECT preference_id AS id, category, position_type AS "positionType",
             location, min_salary AS "minSalary", keywords
      FROM job_preferences
      WHERE user_id = $1
    `;
    
    const result = await pool.query(query, [userId]);
    
    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching job preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Get a specific job preference
 * @route GET /api/profile/preferences/:id
 * @access Private
 */
exports.getJobPreferenceById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const query = `
      SELECT preference_id AS id, category, position_type AS "positionType",
             location, min_salary AS "minSalary", keywords
      FROM job_preferences
      WHERE preference_id = $1 AND user_id = $2
    `;
    
    const result = await pool.query(query, [id, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job preference not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching job preference:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Add a new job preference
 * @route POST /api/profile/preferences
 * @access Private
 */
exports.addJobPreference = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      category,
      positionType,
      location,
      minSalary,
      keywords
    } = req.body;
    
    const query = `
      INSERT INTO job_preferences (
        user_id, category, position_type, location, min_salary, keywords
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING preference_id AS id, category, position_type AS "positionType",
                location, min_salary AS "minSalary", keywords
    `;
    
    const result = await pool.query(query, [
      userId, category, positionType, location, minSalary, keywords
    ]);
    
    res.status(201).json({
      success: true,
      message: 'Job preference added successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error adding job preference:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Update a job preference
 * @route PUT /api/profile/preferences/:id
 * @access Private
 */
exports.updateJobPreference = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const {
      category,
      positionType,
      location,
      minSalary,
      keywords
    } = req.body;
    
    // Check if record exists and belongs to user
    const checkQuery = `
      SELECT * FROM job_preferences
      WHERE preference_id = $1 AND user_id = $2
    `;
    
    const checkResult = await pool.query(checkQuery, [id, userId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job preference not found or not authorized'
      });
    }
    
    const updateQuery = `
      UPDATE job_preferences
      SET category = $1, position_type = $2, location = $3, min_salary = $4, keywords = $5
      WHERE preference_id = $6 AND user_id = $7
      RETURNING preference_id AS id, category, position_type AS "positionType",
                location, min_salary AS "minSalary", keywords
    `;
    
    const result = await pool.query(updateQuery, [
      category, positionType, location, minSalary, keywords, id, userId
    ]);
    
    res.status(200).json({
      success: true,
      message: 'Job preference updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating job preference:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Delete a job preference
 * @route DELETE /api/profile/preferences/:id
 * @access Private
 */
exports.deleteJobPreference = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if record exists and belongs to user
    const checkQuery = `
      SELECT * FROM job_preferences
      WHERE preference_id = $1 AND user_id = $2
    `;
    
    const checkResult = await pool.query(checkQuery, [id, userId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job preference not found or not authorized'
      });
    }
    
    const deleteQuery = `
      DELETE FROM job_preferences
      WHERE preference_id = $1 AND user_id = $2
      RETURNING preference_id AS id
    `;
    
    await pool.query(deleteQuery, [id, userId]);
    
    res.status(200).json({
      success: true,
      message: 'Job preference deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting job preference:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};