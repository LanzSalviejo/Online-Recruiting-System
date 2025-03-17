const express = require('express');
const router = express.Router();
const hrApprovalsController = require('../controllers/hrApprovalsController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// All routes in this file should require admin privileges
const adminOnly = roleCheck('admin');

/**
 * @route   GET /api/admin/hr-approvals
 * @desc    Get all pending HR approval requests
 * @access  Private (Admin only)
 */
router.get('/', [auth, adminOnly], hrApprovalsController.getPendingApprovals);
router.put('/:id', [auth, adminOnly], hrApprovalsController.updateApprovalStatus);

/**
 * @route   PUT /api/admin/hr-approvals/:id
 * @desc    Approve or reject an HR staff account
 * @access  Private (Admin only)
 */
router.put('/:id', [auth, adminOnly], hrApprovalsController.updateApprovalStatus);

module.exports = router;