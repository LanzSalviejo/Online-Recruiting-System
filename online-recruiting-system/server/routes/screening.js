const express = require('express');
const router = express.Router();
const screeningController = require('../controllers/screeningController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

/**
 * @route   POST /api/screening/application/:applicationId
 * @desc    Screen a specific application
 * @access  Private (HR only)
 */
router.post(
  '/application/:applicationId',
  [auth, roleCheck('hr')],
  screeningController.screenApplication
);

/**
 * @route   GET /api/screening/application/:applicationId
 * @desc    Get screening result for a specific application
 * @access  Private (HR, Admin, or applicant who owns the application)
 */
router.get(
  '/application/:applicationId',
  auth,
  screeningController.getScreeningResult
);

/**
 * @route   POST /api/screening/batch
 * @desc    Process batch screening for pending applications
 * @access  Private (Admin only)
 */
router.post(
  '/batch',
  [auth, roleCheck('admin')],
  screeningController.batchProcessScreening
);

module.exports = router;