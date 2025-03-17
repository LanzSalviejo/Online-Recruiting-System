const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const auth = require('../middleware/auth'); // Authentication middleware
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for profile image uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/profile-images');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    // Create unique filename with user ID
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    cb(null, `user-${req.user.id}-${uniqueSuffix}${fileExtension}`);
  }
});

// Configure file filter for image uploads
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB limit
  }
});

// Apply auth middleware to all routes
router.use(auth);

// Personal Info routes
router.get('/personal-info', profileController.getPersonalInfo);
router.put('/personal-info', profileController.updatePersonalInfo);

// Profile Image upload
router.post('/image', upload.single('profileImage'), profileController.uploadProfileImage);

// Education routes
router.get('/education', profileController.getEducation);
router.get('/education/:id', profileController.getEducationById);
router.post('/education', profileController.addEducation);
router.put('/education/:id', profileController.updateEducation);
router.delete('/education/:id', profileController.deleteEducation);

// Work Experience routes
router.get('/experience', profileController.getWorkExperience);
router.get('/experience/:id', profileController.getWorkExperienceById);
router.post('/experience', profileController.addWorkExperience);
router.put('/experience/:id', profileController.updateWorkExperience);
router.delete('/experience/:id', profileController.deleteWorkExperience);

// Job Preferences routes
router.get('/preferences', profileController.getJobPreferences);
router.get('/preferences/:id', profileController.getJobPreferenceById);
router.post('/preferences', profileController.addJobPreference);
router.put('/preferences/:id', profileController.updateJobPreference);
router.delete('/preferences/:id', profileController.deleteJobPreference);

module.exports = router;