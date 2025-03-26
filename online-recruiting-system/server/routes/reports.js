const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Apply middleware to ensure only admins can access these routes
const adminOnly = roleCheck('admin');

/**
 * @route   GET /api/reports/category/monthly/:year/:month
 * @desc    Get monthly category report
 * @access  Private (Admin only)
 */
router.get('/category/monthly/:year/:month', [auth, adminOnly], reportController.getMonthlyCategoryReport);

/**
 * @route   GET /api/reports/category/yearly/:year
 * @desc    Get yearly category report
 * @access  Private (Admin only)
 */
router.get('/category/yearly/:year', [auth, adminOnly], reportController.getYearlyCategoryReport);

/**
 * @route   GET /api/reports/qualification/monthly/:year/:month
 * @desc    Get monthly qualification rate report
 * @access  Private (Admin only)
 */
router.get('/qualification/monthly/:year/:month', [auth, adminOnly], reportController.getMonthlyQualificationReport);

/**
 * @route   GET /api/reports/qualification/yearly/:year
 * @desc    Get yearly qualification rate report
 * @access  Private (Admin only)
 */
router.get('/qualification/yearly/:year', [auth, adminOnly], reportController.getYearlyQualificationReport);

module.exports = router;