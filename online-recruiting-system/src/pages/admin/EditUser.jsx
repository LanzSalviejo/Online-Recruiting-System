import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  User, 
  Mail, 
  Key, 
  Calendar, 
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import api from '../../services/api';

const EditUser = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    accountType: 'applicant',
    isActive: true,
    isVerified: true
  });
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [passwordData, setPasswordData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [success, setSuccess] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        
        // In a real application, you would call your API
        // const response = await api.get(`/admin/users/${id}`);
        // setUser(response.data);
        // setFormData({
        //   firstName: response.data.firstName,
        //   lastName: response.data.lastName,
        //   email: response.data.email,
        //   accountType: response.data.accountType,
        //   isActive: response.data.isActive,
        //   isVerified: response.data.isVerified
        // });
        
        // Mock data for demonstration
        setTimeout(() => {
          const mockUser = {
            id,
            firstName: 'John',
            lastName: 'Smith',
            email: 'john@example.com',
            accountType: 'applicant',
            isActive: true,
            isVerified: true,
            createdAt: '2025-01-15T12:00:00.000Z'
          };
          
          setUser(mockUser);
          setFormData({
            firstName: mockUser.firstName,
            lastName: mockUser.lastName,
            email: mockUser.email,
            accountType: mockUser.accountType,
            isActive: mockUser.isActive,
            isVerified: mockUser.isVerified
          });
          
          setLoading(false);
        }, 1000);
      } catch (err) {
        console.error('Error fetching user:', err);
        setError('Failed to load user data. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchUser();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle checkbox inputs
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear any errors for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear any errors for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email address is invalid';
    }
    
    if (showPasswordReset) {
      if (!passwordData.password) {
        errors.password = 'Password is required';
      } else if (passwordData.password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
      }
      
      if (passwordData.password !== passwordData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setSaving(true);
      
      // In a real application, you would call your API
      // for user update and optionally password reset
      
      // Simulate API call with timeout
      setTimeout(() => {
        // Set success message
        setSuccess('User updated successfully');
        
        // Reset password form if it was shown
        if (showPasswordReset) {
          setPasswordData({
            password: '',
            confirmPassword: ''
          });
          setShowPasswordReset(false);
        }
        
        setSaving(false);
        
        // Clear success message after a few seconds
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      }, 1000);
    } catch (err) {
      console.error('Error updating user:', err);
      setError('Failed to update user. Please try again.');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading user data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="error-message">
          <AlertTriangle size={24} />
          <p>{error}</p>
        </div>
        <div className="error-actions">
          <button
            onClick={() => navigate('/manage-users')}
            className="button-secondary"
          >
            Back to Users
          </button>
          <button
            onClick={() => window.location.reload()}
            className="button-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <Link to="/manage-users" className="back-link">
          <ArrowLeft size={16} />
          Back to Users
        </Link>
        <h1 className="page-title">Edit User</h1>
      </div>
      
      {success && (
        <div className="success-message">
          <CheckCircle size={20} />
          <p>{success}</p>
        </div>
      )}
      
      <div className="user-edit-container">
        <div className="user-info-header">
          <div className="user-avatar-large">
            {user.firstName.charAt(0)}{user.lastName.charAt(0)}
          </div>
          <div className="user-header-details">
            <h2 className="user-header-name">{user.firstName} {user.lastName}</h2>
            <div className="user-header-email">{user.email}</div>
            <div className="user-header-meta">
              <span className={`user-badge ${
                user.accountType === 'admin' 
                  ? 'user-badge-admin' 
                  : user.accountType === 'hr'
                    ? 'user-badge-hr'
                    : 'user-badge-applicant'
              }`}>
                {user.accountType.charAt(0).toUpperCase() + user.accountType.slice(1)}
              </span>
              <span className="user-joined">
                <Calendar size={14} />
                Joined {new Date(user.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="user-edit-form">
          <div className="form-section">
            <h3 className="form-section-title">User Information</h3>
            
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="firstName" className="form-label">
                  <User size={16} className="form-label-icon" />
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`form-input ${formErrors.firstName ? 'form-input-error' : ''}`}
                />
                {formErrors.firstName && (
                  <p className="form-error">{formErrors.firstName}</p>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="lastName" className="form-label">
                  <User size={16} className="form-label-icon" />
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`form-input ${formErrors.lastName ? 'form-input-error' : ''}`}
                />
                {formErrors.lastName && (
                  <p className="form-error">{formErrors.lastName}</p>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  <Mail size={16} className="form-label-icon" />
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`form-input ${formErrors.email ? 'form-input-error' : ''}`}
                />
                {formErrors.email && (
                  <p className="form-error">{formErrors.email}</p>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="accountType" className="form-label">
                  Account Type
                </label>
                <select
                  id="accountType"
                  name="accountType"
                  value={formData.accountType}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="applicant">Applicant</option>
                  <option value="hr">HR Staff</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              
              <div className="form-group form-group-checkbox">
                <label className="form-checkbox-container">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="form-checkbox"
                  />
                  <span className="form-checkbox-label">Active Account</span>
                </label>
                <p className="form-help-text">
                  Inactive accounts cannot log in to the system
                </p>
              </div>
              
              <div className="form-group form-group-checkbox">
                <label className="form-checkbox-container">
                  <input
                    type="checkbox"
                    name="isVerified"
                    checked={formData.isVerified}
                    onChange={handleChange}
                    className="form-checkbox"
                  />
                  <span className="form-checkbox-label">Email Verified</span>
                </label>
                <p className="form-help-text">
                  Unverified accounts may have limited access
                </p>
              </div>
            </div>
          </div>
          
          <div className="form-section">
            <div className="form-section-header">
              <h3 className="form-section-title">Password Management</h3>
              <button
                type="button"
                onClick={() => setShowPasswordReset(!showPasswordReset)}
                className="form-section-action"
              >
                {showPasswordReset ? 'Cancel' : 'Reset Password'}
              </button>
            </div>
            
            {showPasswordReset ? (
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="password" className="form-label">
                    <Key size={16} className="form-label-icon" />
                    New Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={passwordData.password}
                    onChange={handlePasswordChange}
                    className={`form-input ${formErrors.password ? 'form-input-error' : ''}`}
                  />
                  {formErrors.password && (
                    <p className="form-error">{formErrors.password}</p>
                  )}
                </div>
                
                <div className="form-group">
                  <label htmlFor="confirmPassword" className="form-label">
                    <Key size={16} className="form-label-icon" />
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className={`form-input ${formErrors.confirmPassword ? 'form-input-error' : ''}`}
                  />
                  {formErrors.confirmPassword && (
                    <p className="form-error">{formErrors.confirmPassword}</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="password-info">
                User's password is securely hashed and cannot be viewed. You can reset the password if needed.
              </p>
            )}
          </div>
          
          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/manage-users')}
              className="button-secondary"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="button-primary"
              disabled={saving}
            >
              {saving ? (
                <>
                  <div className="button-spinner"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUser;