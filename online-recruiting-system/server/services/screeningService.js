const pool = require('../config/db');

/**
 * Service for AI-powered application screening
 */
class ScreeningService {
  /**
   * Screen a job application against job requirements
   * @param {number} applicationId - Application ID to screen
   * @returns {Promise<Object>} Screening results with score and status
   */
  async screenApplication(applicationId) {
    try {
      // 1. Get application details, applicant info, and job posting requirements
      const applicationQuery = `
        SELECT 
          a.*, 
          j.min_education_level, 
          j.min_experience,
          j.requirements,
          j.title as job_title,
          j.id as job_id
        FROM job_applications a
        JOIN job_postings j ON a.job_id = j.id
        WHERE a.id = $1
      `;
      
      const applicationResult = await pool.query(applicationQuery, [applicationId]);
      
      if (applicationResult.rows.length === 0) {
        throw new Error('Application not found');
      }
      
      const application = applicationResult.rows[0];
      const applicantId = application.applicant_id;
      
      // 2. Get applicant's education records
      const educationQuery = `
        SELECT * FROM education
        WHERE user_id = $1
        ORDER BY end_date DESC
      `;
      
      const educationResult = await pool.query(educationQuery, [applicantId]);
      const education = educationResult.rows;
      
      // 3. Get applicant's work experience records
      const experienceQuery = `
        SELECT * FROM work_experience
        WHERE user_id = $1
      `;
      
      const experienceResult = await pool.query(experienceQuery, [applicantId]);
      const workExperience = experienceResult.rows;
      
      // 4. Calculate education score (0-40 points)
      let educationScore = this._calculateEducationScore(
        education, 
        application.min_education_level
      );
      
      // 5. Calculate experience score (years × 8, max 40 points)
      let experienceScore = this._calculateExperienceScore(
        workExperience,
        application.min_experience
      );
      
      // 6. Calculate skills match score (matching skills ÷ required skills × 20)
      let skillsScore = this._calculateSkillsScore(
        workExperience,
        application.requirements
      );
      
      // 7. Calculate total score and determine qualification
      const totalScore = educationScore + experienceScore + skillsScore;
      const passedScreening = totalScore >= 75;
      
      // 8. Prepare screening details
      const screeningDetails = {
        applicationId,
        jobId: application.job_id,
        applicantId,
        score: Math.round(totalScore),
        educationScore: Math.round(educationScore),
        experienceScore: Math.round(experienceScore),
        skillsScore: Math.round(skillsScore),
        passed: passedScreening,
        status: passedScreening ? 'Under Review' : 'Screened Out',
        screenedAt: new Date()
      };
      
      // 9. Save screening results
      await this._saveScreeningResults(screeningDetails);
      
      // 10. Return formatted results
      return {
        applicationId,
        jobTitle: application.job_title,
        score: Math.round(totalScore),
        educationScore: Math.round(educationScore),
        experienceScore: Math.round(experienceScore),
        skillsScore: Math.round(skillsScore),
        passed: passedScreening,
        details: {
          highestEducation: education.length > 0 ? education[0].degree_level : 'None',
          totalExperienceYears: this._calculateTotalExperience(workExperience),
          requiredExperienceYears: application.min_experience,
          requiredEducation: application.min_education_level
        }
      };
    } catch (error) {
      console.error('Error in application screening:', error);
      throw error;
    }
  }
  
  /**
   * Calculate education score for screening
   * @private
   */
  _calculateEducationScore(education, requiredLevel) {
    // Map education levels to numeric values
    const educationLevels = {
      'High School': 1,
      'Associate': 2,
      'Diploma': 3,
      'Bachelor': 4,
      'Master': 5,
      'PhD': 6
    };
    
    // Default to 0 if no education records
    if (!education || education.length === 0) {
      return 0;
    }
    
    // Find highest education level
    let highestLevel = 0;
    education.forEach(edu => {
      const eduLevel = educationLevels[edu.degree_level] || 0;
      if (eduLevel > highestLevel) {
        highestLevel = eduLevel;
      }
    });
    
    // Get required education level
    const requiredLevelValue = educationLevels[requiredLevel] || 0;
    
    // Calculate education score
    if (highestLevel >= requiredLevelValue + 1) {
      // Exceeds required education
      return 40;
    } else if (highestLevel === requiredLevelValue) {
      // Meets required education
      return 30;
    } else if (highestLevel === requiredLevelValue - 1) {
      // One level below required
      return 15;
    } else {
      // More than one level below
      return 0;
    }
  }
  
  /**
   * Calculate experience score for screening
   * @private
   */
  _calculateExperienceScore(workExperience, requiredExperience) {
    // Calculate total years of experience
    const totalYears = this._calculateTotalExperience(workExperience);
    
    // If they meet the minimum, give points based on years (8 points per year, max 40)
    if (totalYears >= requiredExperience) {
      return Math.min(totalYears * 8, 40);
    } else {
      // If they don't meet the minimum, calculate a partial score
      const ratio = totalYears / requiredExperience;
      return Math.min(40 * ratio, 30); // Max 30 points for below-minimum experience
    }
  }
  
  /**
   * Calculate total years of experience from work history
   * @private
   */
  _calculateTotalExperience(workExperience) {
    if (!workExperience || workExperience.length === 0) {
      return 0;
    }
    
    let totalYears = 0;
    const currentDate = new Date();
    
    workExperience.forEach(exp => {
      const startDate = new Date(exp.start_date);
      const endDate = exp.current_job ? currentDate : new Date(exp.end_date);
      
      // Calculate years (including fractional years)
      const yearsDiff = (endDate - startDate) / (1000 * 60 * 60 * 24 * 365.25);
      totalYears += Math.max(0, yearsDiff); // Ensure no negative values
    });
    
    return parseFloat(totalYears.toFixed(1)); // Round to 1 decimal place
  }
  
  /**
   * Calculate skills match score for screening
   * @private
   */
  _calculateSkillsScore(workExperience, requirements) {
    // Parse requirements if it's a string
    let requiredSkills = [];
    if (typeof requirements === 'string') {
      try {
        requiredSkills = JSON.parse(requirements);
      } catch (e) {
        // If not valid JSON, treat as a comma-separated string
        requiredSkills = requirements.split(',').map(s => s.trim());
      }
    } else if (Array.isArray(requirements)) {
      requiredSkills = requirements;
    }
    
    // If no required skills, give full points
    if (!requiredSkills || requiredSkills.length === 0) {
      return 20;
    }
    
    // Extract all skills from work experience
    const applicantSkills = [];
    workExperience.forEach(exp => {
      if (exp.skills) {
        let skills = [];
        
        // Parse skills if it's a string
        if (typeof exp.skills === 'string') {
          try {
            skills = JSON.parse(exp.skills);
          } catch (e) {
            // If not valid JSON, treat as a comma-separated string
            skills = exp.skills.split(',').map(s => s.trim());
          }
        } else if (Array.isArray(exp.skills)) {
          skills = exp.skills;
        }
        
        applicantSkills.push(...skills);
      }
    });
    
    // Count matching skills using simple string matching
    let matchingSkills = 0;
    requiredSkills.forEach(requiredSkill => {
      // Simple string matching (could be improved with NLP)
      const hasSkill = applicantSkills.some(
        appSkill => {
          const req = requiredSkill.toLowerCase();
          const app = appSkill.toLowerCase();
          return app.includes(req) || req.includes(app);
        }
      );
      
      if (hasSkill) {
        matchingSkills++;
      }
    });
    
    // Calculate score as a percentage of required skills matched (max 20 points)
    return (matchingSkills / requiredSkills.length) * 20;
  }
  
  /**
   * Save screening results to database
   * @private
   */
  async _saveScreeningResults(screeningDetails) {
    // Update job application with screening results
    const updateQuery = `
      UPDATE job_applications
      SET 
        screening_score = $1,
        passed_screening = $2,
        status = $3,
        screened_at = $4
      WHERE id = $5
      RETURNING *
    `;
    
    const values = [
      screeningDetails.score,
      screeningDetails.passed,
      screeningDetails.status,
      screeningDetails.screenedAt,
      screeningDetails.applicationId
    ];
    
    await pool.query(updateQuery, values);
  }
  
  /**
   * Get applications needing screening (batch processing)
   * @returns {Promise<Array>} Applications that need screening
   */
  async getPendingScreeningApplications(limit = 10) {
    const query = `
      SELECT a.id
      FROM job_applications a
      WHERE a.status = 'Pending' 
        AND a.screening_score IS NULL
      ORDER BY a.application_date ASC
      LIMIT $1
    `;
    
    const result = await pool.query(query, [limit]);
    return result.rows.map(row => row.id);
  }
  
  /**
   * Process batch screening for pending applications
   * @param {number} batchSize - Number of applications to process
   * @returns {Promise<Array>} Screening results
   */
  async processPendingScreenings(batchSize = 10) {
    const pendingApplicationIds = await this.getPendingScreeningApplications(batchSize);
    const results = [];
    
    for (const applicationId of pendingApplicationIds) {
      try {
        const screeningResult = await this.screenApplication(applicationId);
        results.push({
          applicationId,
          success: true,
          result: screeningResult
        });
      } catch (error) {
        console.error(`Error screening application ${applicationId}:`, error);
        results.push({
          applicationId,
          success: false,
          error: error.message
        });
      }
    }
    
    return results;
  }
}

module.exports = new ScreeningService();