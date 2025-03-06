/**
 * Job Preference Matching Algorithm
 * Matches job postings with applicant preferences
 * Returns a score between 0-1 representing match quality
 */
const matchJobWithPreferences = async (jobPosting, applicantPreferences) => {
    try {
      let totalScore = 0;
      let maxPossibleScore = 4; // We have 4 criteria: category, location, position type, salary
      
      // Category match calculation
      const categoryMatch = applicantPreferences.categories.some(
        cat => cat.toString() === jobPosting.category.toString()
      );
      
      // If the exact category is in preferences, score 1
      // If a related category is in preferences, score 0.5
      // (related categories would be defined in a separate mapping)
      if (categoryMatch) {
        totalScore += 1;
      } else {
        // Check for related categories (example implementation)
        const relatedCategories = await getRelatedCategories(jobPosting.category);
        const hasRelatedCategory = applicantPreferences.categories.some(
          cat => relatedCategories.includes(cat.toString())
        );
        
        if (hasRelatedCategory) {
          totalScore += 0.5;
        }
      }
      
      // Location match calculation
      const locationMatch = applicantPreferences.locations.some(
        loc => jobPosting.location.toLowerCase().includes(loc.toLowerCase())
      );
      
      if (locationMatch) {
        totalScore += 1;
      } else {
        // Check if in same region/area (simplified example)
        const jobRegion = getRegionFromLocation(jobPosting.location);
        const hasRegionMatch = applicantPreferences.locations.some(
          loc => getRegionFromLocation(loc) === jobRegion
        );
        
        if (hasRegionMatch) {
          totalScore += 0.5;
        }
      }
      
      // Position type match
      const positionTypeMatch = applicantPreferences.positionType.some(
        type => type === jobPosting.positionType
      );
      
      if (positionTypeMatch) {
        totalScore += 1;
      }
      
      // Salary match
      if (jobPosting.salary && applicantPreferences.minSalary) {
        if (jobPosting.salary >= applicantPreferences.minSalary) {
          totalScore += 1;
        } else if (jobPosting.salary >= applicantPreferences.minSalary * 0.9) {
          // Within 10% of desired salary
          totalScore += 0.5;
        }
      } else {
        // If salary information is incomplete, we don't count it in the score
        maxPossibleScore -= 1;
      }
      
      // Calculate final normalized score (0-1)
      const finalScore = maxPossibleScore > 0 ? totalScore / maxPossibleScore : 0;
      
      return finalScore;
    } catch (error) {
      console.error('Error in job preference matching:', error);
      return 0;
    }
  };
  
  /**
   * Application Screening Algorithm
   * Evaluates applicant qualifications against job requirements
   * Returns a screening score and pass/fail result
   */
  const screenApplication = async (application, jobPosting, applicantProfile) => {
    try {
      // Get applicant's education and work experience
      const education = await Education.find({ applicantId: application.applicantId })
        .sort({ endDate: -1 });
      
      const workExperience = await WorkExperience.find({ applicantId: application.applicantId });
      
      // Calculate education score (0-40 points)
      let educationScore = 0;
      const educationLevels = {
        'High School': 1,
        'Associate': 2,
        'Diploma': 3,
        'Bachelor': 4,
        'Master': 5,
        'PhD': 6
      };
      
      // Get applicant's highest education level
      let highestEducation = null;
      let highestLevel = 0;
      
      education.forEach(edu => {
        const eduLevel = educationLevels[edu.degree] || 0;
        if (eduLevel > highestLevel) {
          highestLevel = eduLevel;
          highestEducation = edu;
        }
      });
      
      // Get required education level for the job
      const requiredLevel = educationLevels[jobPosting.minEducationLevel] || 0;
      
      // Calculate education score
      if (highestLevel >= requiredLevel + 1) {
        // Exceeds required education
        educationScore = 40;
      } else if (highestLevel === requiredLevel) {
        // Meets required education
        educationScore = 30;
      } else if (highestLevel === requiredLevel - 1) {
        // One level below required
        educationScore = 15;
      }
      
      // Calculate experience score (years × 8, max 40 points)
      let totalExperienceYears = 0;
      
      workExperience.forEach(exp => {
        const startDate = new Date(exp.startDate);
        const endDate = exp.current ? new Date() : new Date(exp.endDate);
        
        // Calculate years of experience for this position
        const years = (endDate - startDate) / (1000 * 60 * 60 * 24 * 365);
        totalExperienceYears += years;
      });
      
      const experienceScore = Math.min(totalExperienceYears * 8, 40);
      
      // Calculate skills match score (matching skills ÷ required skills × 20)
      const requiredSkills = jobPosting.requirements || [];
      let matchingSkills = 0;
      
      // Extract all skills from work experience
      const applicantSkills = [];
      workExperience.forEach(exp => {
        if (exp.skills && Array.isArray(exp.skills)) {
          applicantSkills.push(...exp.skills);
        }
      });
      
      // Count matching skills
      requiredSkills.forEach(skill => {
        // Simple string matching (could be improved with NLP)
        const hasSkill = applicantSkills.some(
          appSkill => appSkill.toLowerCase().includes(skill.toLowerCase()) || 
                     skill.toLowerCase().includes(appSkill.toLowerCase())
        );
        
        if (hasSkill) {
          matchingSkills++;
        }
      });
      
      const skillsScore = requiredSkills.length > 0 
        ? (matchingSkills / requiredSkills.length) * 20 
        : 20; // If no required skills specified, give full points
      
      // Calculate total score
      const totalScore = educationScore + experienceScore + skillsScore;
      
      // Determine screening result
      const passedScreening = totalScore >= 75;
      
      return {
        score: totalScore,
        educationScore,
        experienceScore,
        skillsScore,
        passedScreening,
        highestEducation: highestEducation?.degree || 'None',
        totalExperienceYears: Math.round(totalExperienceYears * 10) / 10, // Round to 1 decimal
        matchingSkills,
        requiredSkillsCount: requiredSkills.length
      };
    } catch (error) {
      console.error('Error in application screening:', error);
      return {
        score: 0,
        passedScreening: false,
        error: error.message
      };
    }
  };
  
  /**
   * Notification System
   * Sends email notifications for job matches and application status updates
   */
  const sendJobMatchNotification = async (applicantId, jobPosting, matchScore) => {
    try {
      // Get applicant details
      const applicant = await Applicant.findById(applicantId).populate('userId');
      
      if (!applicant || !applicant.userId) {
        throw new Error('Applicant not found');
      }
      
      const emailData = {
        to: applicant.userId.email,
        subject: `New Job Match: ${jobPosting.title}`,
        template: 'job-match-notification',
        context: {
          applicantName: `${applicant.userId.firstName} ${applicant.userId.lastName}`,
          jobTitle: jobPosting.title,
          matchScore: Math.round(matchScore * 100),
          jobLocation: jobPosting.location,
          jobType: jobPosting.positionType,
          salary: jobPosting.salary ? `$${jobPosting.salary}` : 'Not specified',
          applicationDeadline: new Date(jobPosting.dueDate).toLocaleDateString(),
          jobLink: `${process.env.WEBSITE_URL}/jobs/${jobPosting._id}`
        }
      };
      
      // Send email (implementation depends on email service being used)
      await emailService.sendEmail(emailData);
      
      // Log notification
      console.log(`Job match notification sent to ${applicant.userId.email} for job ${jobPosting._id}`);
      
      return true;
    } catch (error) {
      console.error('Error sending job match notification:', error);
      return false;
    }
  };
  
  const sendApplicationStatusUpdate = async (application, status, message) => {
    try {
      // Get applicant and job details
      const applicant = await Applicant.findById(application.applicantId).populate('userId');
      const jobPosting = await JobPosting.findById(application.jobId);
      
      if (!applicant || !applicant.userId || !jobPosting) {
        throw new Error('Applicant or job posting not found');
      }
      
      const emailData = {
        to: applicant.userId.email,
        subject: `Application Status Update: ${jobPosting.title}`,
        template: 'application-status-update',
        context: {
          applicantName: `${applicant.userId.firstName} ${applicant.userId.lastName}`,
          jobTitle: jobPosting.title,
          status: status,
          message: message,
          applicationDate: new Date(application.applicationDate).toLocaleDateString(),
          jobLink: `${process.env.WEBSITE_URL}/jobs/${jobPosting._id}`
        }
      };
      
      // Send email
      await emailService.sendEmail(emailData);
      
      // Log notification
      console.log(`Application status notification sent to ${applicant.userId.email}`);
      
      return true;
    } catch (error) {
      console.error('Error sending application status notification:', error);
      return false;
    }
  };
  
  /**
   * Helper functions for region matching and related categories
   */
  const getRegionFromLocation = (location) => {
    // This is a simplified implementation
    // In a real system, you would use a geocoding service or a predefined region mapping
    const locationLower = location.toLowerCase();
    
    // Example mapping for Canadian provinces/regions
    if (locationLower.includes('vancouver') || locationLower.includes('victoria') || 
        locationLower.includes('surrey') || locationLower.includes('richmond')) {
      return 'British Columbia';
    }
    
    if (locationLower.includes('toronto') || locationLower.includes('ottawa') || 
        locationLower.includes('mississauga')) {
      return 'Ontario';
    }
    
    // Default to the location itself if no region match
    return location;
  };
  
  const getRelatedCategories = async (categoryId) => {
    // In a real system, this would query a category relationship mapping
    // For this example, we'll return hardcoded related categories
    
    // Example category relationships
    const categoryRelationships = {
      // Example IDs - in a real system, these would be actual MongoDB ObjectIds
      'computer_science': ['information_technology', 'software_development', 'data_science'],
      'information_technology': ['computer_science', 'cybersecurity', 'network_administration'],
      'accounting': ['finance', 'banking', 'business_administration'],
      'business_administration': ['human_resources', 'operations', 'accounting'],
      // Add more mappings as needed
    };
    
    // Get the category document
    const category = await JobCategory.findById(categoryId);
    
    if (!category) {
      return [];
    }
    
    // Convert category name to slug for lookup
    const categorySlug = category.name.toLowerCase().replace(/\s+/g, '_');
    
    // Return related categories or empty array if none found
    return categoryRelationships[categorySlug] || [];
  };
  
  module.exports = {
    matchJobWithPreferences,
    screenApplication,
    sendJobMatchNotification,
    sendApplicationStatusUpdate
  };