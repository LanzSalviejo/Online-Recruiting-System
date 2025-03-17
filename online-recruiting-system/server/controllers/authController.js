const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
require('dotenv').config();

const User = require('../models/User');

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Check if user exists
    const userQuery = 'SELECT * FROM users WHERE email = $1';
    const userResult = await pool.query(userQuery, [email]);
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = userResult.rows[0];

    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({ message: 'Your account has been deactivated. Please contact support.' });
    }

    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // For HR accounts, check if approved
    if (user.account_type === 'hr') {
      const hrQuery = 'SELECT is_approved FROM hr_staff WHERE user_id = $1';
      const hrResult = await pool.query(hrQuery, [user.id]);
      
      if (hrResult.rows.length > 0 && !hrResult.rows[0].is_approved) {
        return res.status(401).json({ message: 'Your HR account is pending approval.' });
      }
    }

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
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        
        // Return user data without the password
        const userResponse = {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          accountType: user.account_type,
          imagePath: user.image_path
        };
        
        res.json({ 
          token, 
          user: userResponse
        });
      }
    );
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// @route   POST /api/auth/register
// @desc    Register a user
// @access  Public
exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, accountType } = req.body;

    // Validate input
    if (!firstName || !lastName || !email || !password || !accountType) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Check if user already exists
    const userCheckQuery = 'SELECT * FROM users WHERE email = $1';
    const userCheckResult = await pool.query(userCheckQuery, [email]);
    
    if (userCheckResult.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const createUserQuery = `
      INSERT INTO users (
        first_name, 
        last_name, 
        email, 
        password, 
        account_type, 
        is_active, 
        is_verified, 
        created_at
      ) VALUES ($1, $2, $3, $4, $5, true, false, NOW())
      RETURNING id, first_name, last_name, email, account_type, is_active, is_verified, image_path
    `;
    
    const values = [firstName, lastName, email, hashedPassword, accountType];
    const userResult = await pool.query(createUserQuery, values);
    
    const user = userResult.rows[0];

    // Create additional profile based on account type
    if (accountType === 'applicant') {
      const { phoneNumber, dateOfBirth } = req.body;
      
      const createApplicantQuery = `
        INSERT INTO applicants (user_id, phone_number, date_of_birth, created_at)
        VALUES ($1, $2, $3, NOW())
      `;
      
      await pool.query(createApplicantQuery, [user.id, phoneNumber, dateOfBirth]);
    } else if (accountType === 'hr') {
      const { workingId, phoneNumber } = req.body;
      
      const createHRQuery = `
        INSERT INTO hr_staff (user_id, working_id, phone_number, is_approved, created_at)
        VALUES ($1, $2, $3, false, NOW())
      `;
      
      await pool.query(createHRQuery, [user.id, workingId, phoneNumber]);
    }

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
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        res.status(201).json({ 
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
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
exports.getCurrentUser = async (req, res) => {
  try {
    // Grab user ID from auth middleware
    const userId = req.user.id;
    
    // Get user details excluding password
    const userQuery = `
      SELECT 
        id, 
        first_name, 
        last_name, 
        email, 
        account_type, 
        is_active, 
        is_verified, 
        image_path, 
        created_at
      FROM users 
      WHERE id = $1
    `;
    
    const userResult = await pool.query(userQuery, [userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    // Format response
    const userResponse = {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      accountType: user.account_type,
      isActive: user.is_active,
      isVerified: user.is_verified,
      imagePath: user.image_path,
      createdAt: user.created_at
    };
    
    res.json(userResponse);
  } catch (err) {
    console.error('Error getting current user:', err);
    res.status(500).json({ message: 'Server error' });
  }
};