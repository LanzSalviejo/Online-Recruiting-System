const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Apply middleware to ensure only admins can access these routes
const adminOnly = roleCheck('admin');

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with filtering and pagination
 * @access  Private (Admin only)
 */
router.get('/users', [auth, adminOnly], adminController.getAllUsers);

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get a specific user by ID
 * @access  Private (Admin only)
 */
router.get('/users/:id', [auth, adminOnly], adminController.getUserById);

/**
 * @route   POST /api/admin/users
 * @desc    Create a new user
 * @access  Private (Admin only)
 */
router.post('/users', [auth, adminOnly], adminController.createUser);

/**
 * @route   PUT /api/admin/users/:id
 * @desc    Update a user
 * @access  Private (Admin only)
 */
router.put('/users/:id', [auth, adminOnly], adminController.updateUser);

/**
 * @route   PUT /api/admin/users/:id/toggle-activation
 * @desc    Toggle user activation status
 * @access  Private (Admin only)
 */
router.put('/users/:id/toggle-activation', [auth, adminOnly], adminController.toggleActivation);

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete a user
 * @access  Private (Admin only)
 */
router.delete('/users/:id', [auth, adminOnly], adminController.deleteUser);

module.exports = router;