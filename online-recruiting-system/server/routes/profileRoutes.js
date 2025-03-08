const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const auth = require('../middleware/auth'); // Authentication middleware
const upload = require('../middleware/upload'); // File upload middleware

// Personal Info routes
router.get('/personal-info', auth, profileController.getPersonalInfo);
router.put('/personal-info', auth, profileController.updatePersonalInfo);

// Education routes
router.get('/education', auth, profileController.getEducation);
router.post('/education', auth, profileController.addEducation);
router.put('/education/:id', auth, profileController.updateEducation);
router.delete('/education/:id', auth, profileController.deleteEducation);

// Work Experience routes
router.get('/experience', auth, profileController.getWorkExperience);
router.post('/experience', auth, profileController.addWorkExperience);
router.put('/experience/:id', auth, profileController.updateWorkExperience);
router.delete('/experience/:id', auth, profileController.deleteWorkExperience);

// Job Preferences routes
router.get('/preferences', auth, profileController.getJobPreferences);
router.post('/preferences', auth, profileController.addJobPreference);
router.put('/preferences/:id', auth, profileController.updateJobPreference);
router.delete('/preferences/:id', auth, profileController.deleteJobPreference);

// Profile Image route
router.post('/image', auth, upload.single('profileImage'), profileController.uploadProfileImage);

module.exports = router;