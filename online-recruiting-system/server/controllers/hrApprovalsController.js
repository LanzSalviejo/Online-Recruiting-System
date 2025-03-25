const pool = require('../config/db');
const emailService = require('../utils/sendEmail');

/**
 * Get all pending HR approval requests
 * @route GET /api/admin/hr-approvals
 * @access Private (Admin only)
 */
exports.getPendingApprovals = async (req, res) => {
  try {
    console.log('Executing HR approvals query...');
    
    const query = `
    SELECT 
        u.id,
        u.first_name AS "firstName",
        u.last_name AS "lastName",
        u.email,
        u.created_at AS "createdAt",
        hr.working_id AS "workingId",
        hr.phone_number AS "phoneNumber",
        hr.company_name AS "companyName"
    FROM 
        users u
    JOIN 
        hr_staff hr ON u.id = hr.user_id
    WHERE 
        u.account_type = 'hr' 
        AND hr.is_approved = false
        AND hr.is_rejected = false
    ORDER BY 
        u.created_at DESC
    `;
    
    console.log('Executing query:', query);
    const result = await pool.query(query);
    console.log(`Found ${result.rows.length} pending HR approvals`);
    
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching pending HR approvals:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Approve or reject an HR staff account
 * @route PUT /api/admin/hr-approvals/:id
 * @access Private (Admin only)
 */
exports.updateApprovalStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { approved } = req.body;
    
    console.log(`Processing ${approved ? 'approval' : 'rejection'} for user ID: ${id}`);
    
    // Update the HR staff approval status
    const updateQuery = `
      UPDATE hr_staff
      SET 
        is_approved = $1,
        is_rejected = $2
      WHERE user_id = $3
      RETURNING *
    `;
    
    const result = await pool.query(updateQuery, [
      approved, 
      !approved, // Set is_rejected to the opposite of approved
      id
    ]);
    
    if (result.rows.length === 0) {
      console.error('HR staff not found for ID:', id);
      return res.status(404).json({ message: 'HR staff not found' });
    }
    
    console.log('Successfully updated HR staff approval status');
    
    // Get user details for notification
    const userQuery = `
      SELECT email, first_name, last_name
      FROM users
      WHERE id = $1
    `;
    
    const userResult = await pool.query(userQuery, [id]);
    
    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      
      // Send email notification
      const emailSubject = approved 
        ? 'Your HR Account Has Been Approved' 
        : 'Your HR Account Request Was Declined';
      
      const emailHtml = approved
        ? `
          <h1>HR Account Approved</h1>
          <p>Hello ${user.first_name},</p>
          <p>Your HR account has been approved. You can now log in and start posting jobs.</p>
          <p>Thank you for joining our platform!</p>
        `
        : `
          <h1>HR Account Request Declined</h1>
          <p>Hello ${user.first_name},</p>
          <p>We regret to inform you that your HR account request has been declined.</p>
          <p>If you believe this is an error or would like to provide additional information,
          please contact our support team.</p>
        `;
      
      try {
        await emailService({
          to: user.email,
          subject: emailSubject,
          html: emailHtml
        });
        console.log(`Email notification sent to ${user.email}`);
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
        // Continue processing even if email fails
      }
    }
    
    res.status(200).json({ 
      message: `HR staff account ${approved ? 'approved' : 'rejected'} successfully` 
    });
  } catch (error) {
    console.error('Error updating HR approval status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};