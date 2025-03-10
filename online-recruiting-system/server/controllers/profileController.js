const Education = require('../models/Education');
const WorkExperience = require('../models/WorkExperience');
const JobPreference = require('../models/JobPreference');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');
const jobMatchingService = require('../services/jobMatchingService');

// Helper function to handle file upload
const handleFileUpload = (file, userId) => {
  // Create upload directory if it doesn't exist
  const uploadDir = path.join(__dirname, '../uploads/profile-images');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Get file extension
  const fileExt = path.extname(file.originalname);
  // Create unique filename
  const fileName = `user-${userId}-${Date.now()}${fileExt}`;
  // Set file path
  const filePath = path.join(uploadDir, fileName);
  
  // Write file to uploads directory
  fs.writeFileSync(filePath, file.buffer);
  
  // Return relative path for database storage
  return `/uploads/profile-images/${fileName}`;
};

exports.getPersonalInfo = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Return only necessary personal information
    const personalInfo = {
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      phoneNumber: user.phone_number,
      dateOfBirth: user.date_of_birth,
      street: user.street,
      city: user.city,
      postalCode: user.postal_code,
      imagePath: user.image_path
    };
    
    res.status(200).json({ success: true, data: personalInfo });
  } catch (error) {
    console.error('Error fetching personal info:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updatePersonalInfo = async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body;
    
    // Update user record
    const updatedUser = await User.update(userId, updates);
    
    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.status(200).json({ 
      success: true, 
      message: 'Personal information updated successfully',
      data: {
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name,
        email: updatedUser.email,
        phoneNumber: updatedUser.phone_number,
        dateOfBirth: updatedUser.date_of_birth,
        street: updatedUser.street,
        city: updatedUser.city,
        postalCode: updatedUser.postal_code,
        imagePath: updatedUser.image_path
      }
    });
  } catch (error) {
    console.error('Error updating personal info:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }
    
    const userId = req.user.id;
    
    // Handle file upload
    const imagePath = handleFileUpload(req.file, userId);
    
    // Update user with new image path
    const updatedUser = await User.update(userId, { imagePath });
    
    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.status(200).json({ 
      success: true, 
      message: 'Profile image uploaded successfully',
      data: { imagePath: updatedUser.image_path }
    });
  } catch (error) {
    console.error('Error uploading profile image:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Education Controller Methods
exports.getEducation = async (req, res) => {
  try {
    const userId = req.user.id;
    const education = await Education.findByUserId(userId);
    
    res.status(200).json({ success: true, data: education });
  } catch (error) {
    console.error('Error fetching education:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.addEducation = async (req, res) => {
  try {
    const userId = req.user.id;
    const educationData = {
      userId,
      degreeLevel: req.body.degreeLevel,
      fieldOfStudy: req.body.fieldOfStudy,
      institution: req.body.institution,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      gpa: req.body.gpa || null
    };
    
    const newEducation = await Education.create(educationData);
    
    res.status(201).json({ 
      success: true, 
      message: 'Education added successfully',
      data: newEducation 
    });
  } catch (error) {
    console.error('Error adding education:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateEducation = async (req, res) => {
  try {
    const userId = req.user.id;
    const educationId = req.params.id;
    
    // Check if education record belongs to user
    const belongsToUser = await Education.belongsToUser(educationId, userId);
    if (!belongsToUser) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this education record' });
    }
    
    // Update education record
    const updatedEducation = await Education.update(educationId, req.body);
    
    if (!updatedEducation) {
      return res.status(404).json({ success: false, message: 'Education record not found' });
    }
    
    res.status(200).json({ 
      success: true, 
      message: 'Education updated successfully',
      data: updatedEducation 
    });
  } catch (error) {
    console.error('Error updating education:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.deleteEducation = async (req, res) => {
  try {
    const userId = req.user.id;
    const educationId = req.params.id;
    
    // Check if education record belongs to user
    const belongsToUser = await Education.belongsToUser(educationId, userId);
    if (!belongsToUser) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this education record' });
    }
    
    // Delete education record
    const deletedEducation = await Education.delete(educationId);
    
    if (!deletedEducation) {
      return res.status(404).json({ success: false, message: 'Education record not found' });
    }
    
    res.status(200).json({ 
      success: true, 
      message: 'Education deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting education:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Work Experience Controller Methods
exports.getWorkExperience = async (req, res) => {
  try {
    const userId = req.user.id;
    const workExperience = await WorkExperience.findByUserId(userId);
    
    res.status(200).json({ success: true, data: workExperience });
  } catch (error) {
    console.error('Error fetching work experience:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.addWorkExperience = async (req, res) => {
  try {
    const userId = req.user.id;
    const experienceData = {
      userId,
      jobTitle: req.body.jobTitle,
      company: req.body.company,
      industry: req.body.industry,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      currentJob: req.body.currentJob || false,
      responsibilities: req.body.responsibilities,
      skills: req.body.skills || null
    };
    
    const newExperience = await WorkExperience.create(experienceData);
    
    res.status(201).json({ 
      success: true, 
      message: 'Work experience added successfully',
      data: newExperience 
    });
  } catch (error) {
    console.error('Error adding work experience:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateWorkExperience = async (req, res) => {
  try {
    const userId = req.user.id;
    const experienceId = req.params.id;
    
    // Check if work experience record belongs to user
    const belongsToUser = await WorkExperience.belongsToUser(experienceId, userId);
    if (!belongsToUser) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this work experience record' });
    }
    
    // Update work experience record
    const updatedExperience = await WorkExperience.update(experienceId, req.body);
    
    if (!updatedExperience) {
      return res.status(404).json({ success: false, message: 'Work experience record not found' });
    }
    
    res.status(200).json({ 
      success: true, 
      message: 'Work experience updated successfully',
      data: updatedExperience 
    });
  } catch (error) {
    console.error('Error updating work experience:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.deleteWorkExperience = async (req, res) => {
  try {
    const userId = req.user.id;
    const experienceId = req.params.id;
    
    // Check if work experience record belongs to user
    const belongsToUser = await WorkExperience.belongsToUser(experienceId, userId);
    if (!belongsToUser) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this work experience record' });
    }
    
    // Delete work experience record
    const deletedExperience = await WorkExperience.delete(experienceId);
    
    if (!deletedExperience) {
      return res.status(404).json({ success: false, message: 'Work experience record not found' });
    }
    
    res.status(200).json({ 
      success: true, 
      message: 'Work experience deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting work experience:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Job Preferences Controller Methods
exports.getJobPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const jobPreferences = await JobPreference.findByUserId(userId);
    
    res.status(200).json({ success: true, data: jobPreferences });
  } catch (error) {
    console.error('Error fetching job preferences:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.addJobPreference = async (req, res) => {
  try {
    const userId = req.user.id;
    const preferenceData = {
      userId,
      positionType: req.body.positionType,
      category: req.body.category,
      location: req.body.location,
      minSalary: req.body.minSalary,
      keywords: req.body.keywords || null
    };
    
    const newPreference = await JobPreference.create(preferenceData);
    
    // Trigger matching process asynchronously
    setTimeout(() => {
      jobMatchingService.processNewPreferenceMatching(userId, newPreference.id)
        .then(matchResults => {
          console.log(`Preference matching completed for user ${userId}: ${matchResults.totalMatches} matching jobs found`);
        })
        .catch(error => {
          console.error('Error in background preference matching:', error);
        });
    }, 0);
    
    res.status(201).json({ 
      success: true, 
      message: 'Job preference added successfully',
      data: newPreference 
    });
  } catch (error) {
    console.error('Error adding job preference:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateJobPreference = async (req, res) => {
  try {
    const userId = req.user.id;
    const preferenceId = req.params.id;
    
    // Check if job preference record belongs to user
    const belongsToUser = await JobPreference.belongsToUser(preferenceId, userId);
    if (!belongsToUser) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this job preference record' });
    }
    
    // Update job preference record
    const updatedPreference = await JobPreference.update(preferenceId, req.body);
    
    if (!updatedPreference) {
      return res.status(404).json({ success: false, message: 'Job preference record not found' });
    }
    
    // Trigger matching process asynchronously
    setTimeout(() => {
      jobMatchingService.processNewPreferenceMatching(userId, preferenceId)
        .then(matchResults => {
          console.log(`Preference matching completed after update for user ${userId}: ${matchResults.totalMatches} matching jobs found`);
        })
        .catch(error => {
          console.error('Error in background preference matching after update:', error);
        });
    }, 0);
    
    res.status(200).json({ 
      success: true, 
      message: 'Job preference updated successfully',
      data: updatedPreference 
    });
  } catch (error) {
    console.error('Error updating job preference:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.deleteJobPreference = async (req, res) => {
  try {
    const userId = req.user.id;
    const preferenceId = req.params.id;
    
    // Check if job preference record belongs to user
    const belongsToUser = await JobPreference.belongsToUser(preferenceId, userId);
    if (!belongsToUser) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this job preference record' });
    }
    
    // Delete job preference record
    const deletedPreference = await JobPreference.delete(preferenceId);
    
    if (!deletedPreference) {
      return res.status(404).json({ success: false, message: 'Job preference record not found' });
    }
    
    res.status(200).json({ 
      success: true, 
      message: 'Job preference deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting job preference:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};