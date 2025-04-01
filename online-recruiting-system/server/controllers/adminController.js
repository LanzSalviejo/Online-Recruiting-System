const pool = require('../config/db');
const bcrypt = require('bcryptjs');

/**
 * Get all users with filtering and pagination
 * @route GET /api/admin/users
 * @access Private (Admin only)
 */
exports.getAllUsers = async (req, res) => {
  try {
    // Get query parameters with defaults
    const {
      search,
      accountType,
      isActive,
      isVerified,
      startDate,
      endDate,
      sort = 'newest', // 'newest', 'alphabetical', 'recent'
      page = 1,
      limit = 10
    } = req.query;
    
    // Calculate pagination values
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;
    
    // Start building the query
    let queryText = `
      SELECT id, first_name AS "firstName", last_name AS "lastName", 
             email, account_type AS "accountType", is_active AS "isActive", 
             is_verified AS "isVerified", image_path AS "imagePath", 
             created_at AS "createdAt"
      FROM users
      WHERE 1=1
    `;
    
    // Initialize params array for prepared statement
    let params = [];
    let paramCount = 1;
    
    // Add filters to query if they exist
    if (search) {
      queryText += ` AND (
        first_name ILIKE $${paramCount} 
        OR last_name ILIKE $${paramCount} 
        OR email ILIKE $${paramCount}
      )`;
      params.push(`%${search}%`);
      paramCount++;
    }
    
    if (accountType) {
      queryText += ` AND account_type = $${paramCount}`;
      params.push(accountType);
      paramCount++;
    }
    
    if (isActive !== undefined) {
      queryText += ` AND is_active = $${paramCount}`;
      params.push(isActive === 'true');
      paramCount++;
    }
    
    if (isVerified !== undefined) {
      queryText += ` AND is_verified = $${paramCount}`;
      params.push(isVerified === 'true');
      paramCount++;
    }
    
    if (startDate) {
      queryText += ` AND created_at >= $${paramCount}`;
      params.push(startDate);
      paramCount++;
    }
    
    if (endDate) {
      queryText += ` AND created_at <= $${paramCount}`;
      params.push(endDate);
      paramCount++;
    }
    
    // Count total matching users for pagination
    const countQueryText = `
      SELECT COUNT(*) 
      FROM (${queryText}) AS filtered_users
    `;
    
    const countResult = await pool.query(countQueryText, params);
    const totalUsers = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalUsers / limitNum);
    
    // Add sorting to the main query
    if (sort === 'newest') {
      queryText += ` ORDER BY created_at DESC`;
    } else if (sort === 'alphabetical') {
      queryText += ` ORDER BY last_name ASC, first_name ASC`;
    } else if (sort === 'recent') {
      queryText += ` ORDER BY created_at DESC`;
    }
    
    // Add pagination
    queryText += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limitNum, offset);
    
    // Execute the query
    const result = await pool.query(queryText, params);
    
    // Return the results
    res.json({
      users: result.rows,
      totalUsers,
      totalPages,
      currentPage: pageNum
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get a specific user by ID
 * @route GET /api/admin/users/:id
 * @access Private (Admin only)
 */
exports.getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Query to get user details
    const userQuery = `
      SELECT 
        id, 
        first_name AS "firstName", 
        last_name AS "lastName", 
        email, 
        account_type AS "accountType", 
        is_active AS "isActive", 
        is_verified AS "isVerified", 
        image_path AS "imagePath", 
        created_at AS "createdAt"
      FROM users 
      WHERE id = $1
    `;
    
    const userResult = await pool.query(userQuery, [userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    // Get additional profile data based on account type
    if (user.accountType === 'applicant') {
      const applicantQuery = `
        SELECT phone_number AS "phoneNumber", date_of_birth AS "dateOfBirth"
        FROM applicants 
        WHERE user_id = $1
      `;
      
      const applicantResult = await pool.query(applicantQuery, [userId]);
      if (applicantResult.rows.length > 0) {
        user.profile = applicantResult.rows[0];
      }
    } else if (user.accountType === 'hr') {
      const hrQuery = `
        SELECT working_id AS "workingId", phone_number AS "phoneNumber", is_approved AS "isApproved"
        FROM hr_staff 
        WHERE user_id = $1
      `;
      
      const hrResult = await pool.query(hrQuery, [userId]);
      if (hrResult.rows.length > 0) {
        user.profile = hrResult.rows[0];
      }
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Create a new user
 * @route POST /api/admin/users
 * @access Private (Admin only)
 */
exports.createUser = async (req, res) => {
  try {
    const { 
      firstName, 
      lastName, 
      email, 
      password, 
      accountType, 
      isActive = true,
      isVerified = true,
      phoneNumber,
      dateOfBirth,
      workingId
    } = req.body;
    
    // Validate required fields
    if (!firstName || !lastName || !email || !password || !accountType) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Check if user already exists
    const existingUserQuery = 'SELECT * FROM users WHERE email = $1';
    const existingUserResult = await pool.query(existingUserQuery, [email]);
    
    if (existingUserResult.rows.length > 0) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Begin transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Insert user
      const insertUserQuery = `
        INSERT INTO users (
          first_name, 
          last_name, 
          email, 
          password, 
          account_type, 
          is_active, 
          is_verified, 
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        RETURNING *
      `;
      
      const userResult = await client.query(insertUserQuery, [
        firstName, 
        lastName, 
        email, 
        hashedPassword, 
        accountType, 
        isActive, 
        isVerified
      ]);
      
      const newUser = userResult.rows[0];
      
      // Insert additional profile data based on account type
      if (accountType === 'applicant' && (phoneNumber || dateOfBirth)) {
        const insertApplicantQuery = `
          INSERT INTO applicants (
            user_id, 
            phone_number, 
            date_of_birth, 
            created_at
          ) VALUES ($1, $2, $3, NOW())
        `;
        
        await client.query(insertApplicantQuery, [
          newUser.id, 
          phoneNumber, 
          dateOfBirth
        ]);
      } else if (accountType === 'hr' && (phoneNumber || workingId)) {
        const insertHRQuery = `
          INSERT INTO hr_staff (
            user_id, 
            working_id, 
            phone_number, 
            is_approved, 
            created_at
          ) VALUES ($1, $2, $3, $4, NOW())
        `;
        
        await client.query(insertHRQuery, [
          newUser.id, 
          workingId, 
          phoneNumber, 
          true // Auto-approve HR staff created by admin
        ]);
      }
      
      await client.query('COMMIT');
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = newUser;
      
      res.status(201).json({
        message: 'User created successfully',
        user: {
          ...userWithoutPassword,
          firstName: newUser.first_name,
          lastName: newUser.last_name,
          accountType: newUser.account_type,
          isActive: newUser.is_active,
          isVerified: newUser.is_verified,
          imagePath: newUser.image_path,
          createdAt: newUser.created_at
        }
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Update a user
 * @route PUT /api/admin/users/:id
 * @access Private (Admin only)
 */
exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { 
      firstName, 
      lastName, 
      email, 
      accountType, 
      isActive,
      isVerified,
      password, // Optional - only included if admin wants to reset password
      phoneNumber,
      dateOfBirth,
      workingId
    } = req.body;
    
    // Check if user exists
    const userQuery = 'SELECT * FROM users WHERE id = $1';
    const userResult = await pool.query(userQuery, [userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const existingUser = userResult.rows[0];
    
    // Begin transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Build update query dynamically
      const updates = [];
      const values = [];
      let paramIndex = 1;
      
      if (firstName !== undefined) {
        updates.push(`first_name = $${paramIndex}`);
        values.push(firstName);
        paramIndex++;
      }
      
      if (lastName !== undefined) {
        updates.push(`last_name = $${paramIndex}`);
        values.push(lastName);
        paramIndex++;
      }
      
      if (email !== undefined) {
        // Check if email is already taken by another user
        const emailCheckQuery = 'SELECT id FROM users WHERE email = $1 AND id != $2';
        const emailCheckResult = await client.query(emailCheckQuery, [email, userId]);
        
        if (emailCheckResult.rows.length > 0) {
          await client.query('ROLLBACK');
          return res.status(400).json({ message: 'Email address is already in use' });
        }
        
        updates.push(`email = $${paramIndex}`);
        values.push(email);
        paramIndex++;
      }
      
      if (accountType !== undefined) {
        updates.push(`account_type = $${paramIndex}`);
        values.push(accountType);
        paramIndex++;
      }
      
      if (isActive !== undefined) {
        updates.push(`is_active = $${paramIndex}`);
        values.push(isActive);
        paramIndex++;
      }
      
      if (isVerified !== undefined) {
        updates.push(`is_verified = $${paramIndex}`);
        values.push(isVerified);
        paramIndex++;
      }
      
      if (password) {
        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        updates.push(`password = $${paramIndex}`);
        values.push(hashedPassword);
        paramIndex++;
      }
      
      // If there are updates to the user table
      if (updates.length > 0) {
        values.push(userId);
        
        const updateUserQuery = `
          UPDATE users
          SET ${updates.join(', ')}
          WHERE id = $${paramIndex}
          RETURNING *
        `;
        
        await client.query(updateUserQuery, values);
      }
      
      // Update profile data based on account type
      const currentAccountType = accountType || existingUser.account_type;
      
      if (currentAccountType === 'applicant' && (phoneNumber !== undefined || dateOfBirth !== undefined)) {
        // Check if applicant profile exists
        const applicantCheckQuery = 'SELECT * FROM applicants WHERE user_id = $1';
        const applicantCheckResult = await client.query(applicantCheckQuery, [userId]);
        
        if (applicantCheckResult.rows.length > 0) {
          // Update existing profile
          const applicantUpdates = [];
          const applicantValues = [];
          let applicantParamIndex = 1;
          
          if (phoneNumber !== undefined) {
            applicantUpdates.push(`phone_number = $${applicantParamIndex}`);
            applicantValues.push(phoneNumber);
            applicantParamIndex++;
          }
          
          if (dateOfBirth !== undefined) {
            applicantUpdates.push(`date_of_birth = $${applicantParamIndex}`);
            applicantValues.push(dateOfBirth);
            applicantParamIndex++;
          }
          
          if (applicantUpdates.length > 0) {
            applicantValues.push(userId);
            
            const updateApplicantQuery = `
              UPDATE applicants
              SET ${applicantUpdates.join(', ')}
              WHERE user_id = $${applicantParamIndex}
            `;
            
            await client.query(updateApplicantQuery, applicantValues);
          }
        } else {
          // Create new profile
          const insertApplicantQuery = `
            INSERT INTO applicants (user_id, phone_number, date_of_birth, created_at)
            VALUES ($1, $2, $3, NOW())
          `;
          
          await client.query(insertApplicantQuery, [userId, phoneNumber, dateOfBirth]);
        }
      } else if (currentAccountType === 'hr' && (phoneNumber !== undefined || workingId !== undefined)) {
        // Check if HR profile exists
        const hrCheckQuery = 'SELECT * FROM hr_staff WHERE user_id = $1';
        const hrCheckResult = await client.query(hrCheckQuery, [userId]);
        
        if (hrCheckResult.rows.length > 0) {
          // Update existing profile
          const hrUpdates = [];
          const hrValues = [];
          let hrParamIndex = 1;
          
          if (phoneNumber !== undefined) {
            hrUpdates.push(`phone_number = $${hrParamIndex}`);
            hrValues.push(phoneNumber);
            hrParamIndex++;
          }
          
          if (workingId !== undefined) {
            hrUpdates.push(`working_id = $${hrParamIndex}`);
            hrValues.push(workingId);
            hrParamIndex++;
          }
          
          if (hrUpdates.length > 0) {
            hrValues.push(userId);
            
            const updateHRQuery = `
              UPDATE hr_staff
              SET ${hrUpdates.join(', ')}
              WHERE user_id = $${hrParamIndex}
            `;
            
            await client.query(updateHRQuery, hrValues);
          }
        } else {
          // Create new profile
          const insertHRQuery = `
            INSERT INTO hr_staff (user_id, working_id, phone_number, is_approved, created_at)
            VALUES ($1, $2, $3, $4, NOW())
          `;
          
          await client.query(insertHRQuery, [userId, workingId, phoneNumber, true]);
        }
      }
      
      await client.query('COMMIT');
      
      // Get updated user
      const updatedUserQuery = `
        SELECT 
          id, 
          first_name AS "firstName", 
          last_name AS "lastName", 
          email, 
          account_type AS "accountType", 
          is_active AS "isActive", 
          is_verified AS "isVerified", 
          image_path AS "imagePath", 
          created_at AS "createdAt"
        FROM users 
        WHERE id = $1
      `;
      
      const updatedUserResult = await pool.query(updatedUserQuery, [userId]);
      const updatedUser = updatedUserResult.rows[0];
      
      res.json({
        message: 'User updated successfully',
        user: updatedUser
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Toggle user activation status
 * @route PUT /api/admin/users/:id/toggle-activation
 * @access Private (Admin only)
 */
exports.toggleActivation = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Get current status
    const statusQuery = 'SELECT is_active FROM users WHERE id = $1';
    const statusResult = await pool.query(statusQuery, [userId]);
    
    if (statusResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const currentStatus = statusResult.rows[0].is_active;
    
    // Toggle status
    const updateQuery = 'UPDATE users SET is_active = $1 WHERE id = $2 RETURNING *';
    const updateResult = await pool.query(updateQuery, [!currentStatus, userId]);
    
    res.json({
      message: `User ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
      user: {
        id: updateResult.rows[0].id,
        isActive: updateResult.rows[0].is_active
      }
    });
  } catch (error) {
    console.error('Error toggling user activation:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Delete a user
 * @route DELETE /api/admin/users/:id
 * @access Private (Admin only)
 */
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Check if user exists
    const userQuery = 'SELECT * FROM users WHERE id = $1';
    const userResult = await pool.query(userQuery, [userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Prevent self-deletion
    if (userId === req.user.id) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }
    
    // Delete user - foreign key constraints with CASCADE will handle related records
    const deleteQuery = 'DELETE FROM users WHERE id = $1';
    await pool.query(deleteQuery, [userId]);
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};