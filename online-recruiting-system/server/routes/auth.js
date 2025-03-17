const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Applicant = require('../models/Applicant');
const HRStaff = require('../models/HRStaff');
const sendEmail = require('../utils/sendEmail');
const pool = require('../config/db');

require('dotenv').config();

// @route   POST api/auth/register
// @desc    Register a user
// @access  Public
router.post(
  '/register',
  [
    check('firstName', 'First name is required').not().isEmpty(),
    check('lastName', 'Last name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
    check('accountType', 'Account type is required').isIn(['applicant', 'hr'])
  ],
  async (req, res) => {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, email, password, accountType, phoneNumber, dateOfBirth, workingId } = req.body;

    try {
      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Create new user
      const user = await User.create({
        firstName,
        lastName,
        email,
        password,
        accountType
      });

      // If account type is applicant, create applicant profile
      if (accountType === 'applicant') {
        await Applicant.create({
          userId: user.id,
          phoneNumber,
          dateOfBirth
        });
      }

      // If account type is hr, create HR profile (pending approval)
      if (accountType === 'hr') {
        await HRStaff.create({
          userId: user.id,
          workingId,
          phoneNumber
        });
      }

      // Generate verification token
      const verificationToken = await User.generateVerificationToken(user.id);

      // Create verification URL
      const verificationUrl = `${req.protocol}://${req.get('host')}/api/auth/verify/${verificationToken}`;

      // Email message
      const message = `
        <h1>Email Verification</h1>
        <p>Please verify your email by clicking the link below:</p>
        <a href="${verificationUrl}" target="_blank">Verify Email</a>
      `;

      // Send verification email
      try {
        await sendEmail({
          to: user.email,
          subject: 'Email Verification',
          html: message
        });
        
        // Create JWT payload
        const payload = {
          user: {
            id: user.id,
            accountType: user.account_type
          }
        };

        // Sign token
        jwt.sign(
          payload,
          process.env.JWT_SECRET || 'defaultsecretkey',
          { expiresIn: '24h' },
          (err, token) => {
            if (err) throw err;
            res.json({ 
              token,
              user: {
                id: user.id,
                firstName: user.first_name,
                lastName: user.last_name,
                email: user.email,
                accountType: user.account_type,
                imagePath: user.image_path
              } 
            });
          }
        );
      } catch (error) {
        console.error('Email could not be sent', error);
        
        // Even if email fails, we still want to register the user
        const payload = {
          user: {
            id: user.id,
            accountType: user.account_type
          }
        };

        jwt.sign(
          payload,
          process.env.JWT_SECRET || 'defaultsecretkey',
          { expiresIn: '24h' },
          (err, token) => {
            if (err) throw err;
            res.json({ 
              token,
              user: {
                id: user.id,
                firstName: user.first_name,
                lastName: user.last_name,
                email: user.email,
                accountType: user.account_type,
                imagePath: user.image_path
              },
              message: 'Registration successful but verification email could not be sent.' 
            });
          }
        );
      }
    } catch (err) {
      console.error('Registration error:', err);
      res.status(500).json({ message: 'Server error during registration' });
    }
  }
);

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
  ],
  async (req, res) => {
    console.log('Login request received:', req.body);
    
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      console.log('Finding user by email:', email);
      
      // Check if user exists
      const user = await User.findByEmail(email);
      if (!user) {
        console.log('User not found');
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      console.log('User found, checking if active');

      // Check if user is active
      if (!user.is_active) {
        console.log('User account is deactivated');
        return res.status(401).json({ message: 'Your account has been deactivated. Please contact support.' });
      }
      
      console.log('Checking password match');

      // Check if password matches
      const isMatch = await User.comparePassword(password, user.password);
      if (!isMatch) {
        console.log('Password does not match');
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      console.log('Password matches, checking HR approval if needed');

      // For HR accounts, check if approved
      if (user.account_type === 'hr') {
        const hrStaff = await HRStaff.findByUserId(user.id);
        if (hrStaff && !hrStaff.is_approved) {
          console.log('HR account not approved');
          return res.status(401).json({ message: 'Your HR account is pending approval.' });
        }
      }
      
      console.log('Creating JWT payload');

      // Create JWT payload
      const payload = {
        user: {
          id: user.id,
          accountType: user.account_type
        }
      };
      
      console.log('Signing token');

      // Sign token
      jwt.sign(
        payload,
        process.env.JWT_SECRET || 'defaultsecretkey',
        { expiresIn: '24h' },
        (err, token) => {
          if (err) {
            console.error('Token signing error:', err);
            throw err;
          }
          
          console.log('Login successful, returning token and user data');
          
          res.json({ 
            token, 
            user: {
              id: user.id,
              firstName: user.first_name,
              lastName: user.last_name,
              email: user.email,
              accountType: user.account_type,
              imagePath: user.image_path
            } 
          });
        }
      );
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ message: 'Server error during login' });
    }
  }
);

// @route   GET api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    console.log('Get current user request received for user ID:', req.user.id);
    
    const user = await User.findById(req.user.id);
    if (!user) {
      console.log('User not found');
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log('User found, returning user data');
    
    res.json({
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      accountType: user.account_type,
      isActive: user.is_active,
      isVerified: user.is_verified,
      imagePath: user.image_path,
      createdAt: user.created_at
    });
  } catch (err) {
    console.error('Error getting current user:', err);
    res.status(500).json({ message: 'Server error retrieving user profile' });
  }
});

// @route   POST api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post(
  '/forgot-password',
  [
    check('email', 'Please include a valid email').isEmail()
  ],
  async (req, res) => {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findByEmail(req.body.email);
      if (!user) {
        return res.status(404).json({ message: 'No account found with that email' });
      }

      // Generate reset token
      const resetToken = await User.generateResetToken(user.id);

      // Create reset URL
      const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;

      // Email message
      const message = `
        <h1>Password Reset Request</h1>
        <p>You requested a password reset. Please click the link below to reset your password:</p>
        <a href="${resetUrl}" target="_blank">Reset Password</a>
        <p>This link will expire in 10 minutes.</p>
        <p>If you did not request a password reset, please ignore this email.</p>
      `;

      try {
        await sendEmail({
          to: user.email,
          subject: 'Password Reset Request',
          html: message
        });

        res.json({ message: 'Password reset email sent' });
      } catch (error) {
        console.error('Email could not be sent', error);
        
        // Clear reset token if email fails
        await User.clearResetToken(user.id);

        return res.status(500).json({ message: 'Email could not be sent' });
      }
    } catch (err) {
      console.error('Error during password reset request:', err);
      res.status(500).json({ message: 'Server error during password reset request' });
    }
  }
);

// @route   PUT api/auth/reset-password/:token
// @desc    Reset password
// @access  Public
router.put(
  '/reset-password/:token',
  [
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
  ],
  async (req, res) => {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Get hashed token
      const resetPasswordToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');

      // Find user with matching token and valid expiration
      const user = await User.findByResetToken(resetPasswordToken);

      if (!user) {
        return res.status(400).json({ message: 'Invalid or expired token' });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(req.body.password, salt);

      // Update user with new password and clear token
      await User.update(user.id, { 
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpire: null
      });

      res.json({ message: 'Password has been reset' });
    } catch (err) {
      console.error('Error during password reset:', err);
      res.status(500).json({ message: 'Server error during password reset' });
    }
  }
);

// @route   GET api/auth/verify/:token
// @desc    Verify email
// @access  Public
router.get('/verify/:token', async (req, res) => {
  try {
    // Get hashed token
    const verificationToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    // Find user with matching token and valid expiration
    const user = await User.findByVerificationToken(verificationToken);

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // Verify user
    await User.verifyUser(user.id);

    // Redirect to frontend verification success page
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/verification-success`);
  } catch (err) {
    console.error('Error during email verification:', err);
    res.status(500).json({ message: 'Server error during email verification' });
  }
});

module.exports = router;