const express = require('express');
const router = express.Router();
const jobMatchingController = require('../controllers/jobMatchingController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

/**
 * @route   POST /api/matching/job/:jobId
 * @desc    Process matching for a new job posting
 * @access  Private (HR only)
 */
router.post(
  '/job/:jobId',
  [auth, roleCheck(['hr', 'admin'])],
  jobMatchingController.processJobMatching
);

/**
 * @route   POST /api/matching/preference/:preferenceId
 * @desc    Process matching for a new user preference
 * @access  Private (Applicants only)
 */
router.post(
  '/preference/:preferenceId',
  [auth, roleCheck('applicant')],
  jobMatchingController.processPreferenceMatching
);

/**
 * @route   GET /api/matching/jobs
 * @desc    Get job matches for the current user
 * @access  Private (Applicants only)
 */
router.get(
  '/jobs',
  [auth, roleCheck('applicant')],
  jobMatchingController.getUserJobMatches
);

/**
 * @route   GET /api/matching/applicants/:jobId
 * @desc    Get applicant matches for a specific job
 * @access  Private (HR, Admin)
 */
router.get(
  '/applicants/:jobId',
  [auth, roleCheck(['hr', 'admin'])],
  jobMatchingController.getJobApplicantMatches
);

module.exports = router;