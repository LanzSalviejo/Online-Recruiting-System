const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const User = {
  // Find user by ID
  findById: async (id) => {
    const result = await pool.query(
      'SELECT id, first_name, last_name, email, account_type, is_active, is_verified, image_path, created_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0];
  },

  // Find user by email
  findByEmail: async (email) => {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  },

  // Find user by reset password token
  findByResetToken: async (token) => {
    const result = await pool.query(
      'SELECT * FROM users WHERE reset_password_token = $1 AND reset_password_expire > NOW()',
      [token]
    );
    return result.rows[0];
  },

  // Find user by verification token
  findByVerificationToken: async (token) => {
    const result = await pool.query(
      'SELECT * FROM users WHERE verification_token = $1 AND verification_expire > NOW()',
      [token]
    );
    return result.rows[0];
  },

  // Create a new user
  create: async (userData) => {
    const { firstName, lastName, email, password, accountType } = userData;
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const result = await pool.query(
      'INSERT INTO users (first_name, last_name, email, password, account_type) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [firstName, lastName, email, hashedPassword, accountType]
    );
    
    return result.rows[0];
  },

  // Update user
  update: async (id, updates) => {
    const fields = [];
    const values = [];
    let paramIndex = 1;
    
    // Build dynamic query based on provided updates
    for (const [key, value] of Object.entries(updates)) {
      // Convert camelCase to snake_case for SQL
      const snakeCaseKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      fields.push(`${snakeCaseKey} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
    
    values.push(id);
    
    const result = await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    
    return result.rows[0];
  },

  // Compare password
  comparePassword: async (candidatePassword, hashedPassword) => {
    return await bcrypt.compare(candidatePassword, hashedPassword);
  },

  // Generate and save password reset token
  generateResetToken: async (userId) => {
    // Generate token
    const resetToken = crypto.randomBytes(20).toString('hex');
    
    // Hash token
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
      
    // Set token and expiry (10 minutes)
    const tokenExpiry = new Date(Date.now() + 10 * 60 * 1000);
    
    // Save to database
    await pool.query(
      'UPDATE users SET reset_password_token = $1, reset_password_expire = $2 WHERE id = $3',
      [hashedToken, tokenExpiry, userId]
    );
    
    return resetToken;
  },

  // Generate and save verification token
  generateVerificationToken: async (userId) => {
    // Generate token
    const verificationToken = crypto.randomBytes(20).toString('hex');
    
    // Hash token
    const hashedToken = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');
      
    // Set token and expiry (24 hours)
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    // Save to database
    await pool.query(
      'UPDATE users SET verification_token = $1, verification_expire = $2 WHERE id = $3',
      [hashedToken, tokenExpiry, userId]
    );
    
    return verificationToken;
  },

  // Clear reset password token
  clearResetToken: async (userId) => {
    await pool.query(
      'UPDATE users SET reset_password_token = NULL, reset_password_expire = NULL WHERE id = $1',
      [userId]
    );
  },

  // Clear verification token and mark as verified
  verifyUser: async (userId) => {
    await pool.query(
      'UPDATE users SET verification_token = NULL, verification_expire = NULL, is_verified = TRUE WHERE id = $1',
      [userId]
    );
  }
};

module.exports = User;