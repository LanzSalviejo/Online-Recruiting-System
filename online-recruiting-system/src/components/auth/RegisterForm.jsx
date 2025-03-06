import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    accountType: 'applicant', // Default to applicant
    dateOfBirth: '',
    phoneNumber: '',
    image: null
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [imagePreview, setImagePreview] = useState(null);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    if (type === 'file') {
      const file = e.target.files[0];
      if (file) {
        setFormData({
          ...formData,
          image: file
        });
        
        // Create a preview of the image
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
      }
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validateStep1 = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    
    if (formData.accountType === 'applicant') {
      if (!formData.dateOfBirth) {
        newErrors.dateOfBirth = 'Date of birth is required';
      }
    }
    
    if (!formData.phoneNumber) {
      newErrors.phoneNumber = 'Phone number is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (currentStep === 2 && validateStep2()) {
      setLoading(true);
      try {
        // Create form data to upload image
        const registrationData = new FormData();
        Object.keys(formData).forEach(key => {
          registrationData.append(key, formData[key]);
        });
        
        await register(registrationData);
        navigate('/login', { state: { message: 'Registration successful. Please log in.' } });
      } catch (error) {
        setErrors({
          general: error.message || 'Registration failed. Please try again.'
        });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="auth-form-container">
      <div className="auth-form-content">
        <h2 className="auth-form-title">Create an account</h2>
        
        {errors.general && (
          <div className="auth-error-message">
            {errors.general}
          </div>
        )}
        
        <div className="form-progress">
          <div className="form-progress-track">
            <div className={`form-progress-step ${currentStep >= 1 ? 'form-progress-step-active' : ''}`}>1</div>
            <div className={`form-progress-line ${currentStep >= 2 ? 'form-progress-line-active' : ''}`}></div>
            <div className={`form-progress-step ${currentStep >= 2 ? 'form-progress-step-active' : ''}`}>2</div>
          </div>
          <p className="form-progress-label">
            {currentStep === 1 ? 'Basic Information' : 'Additional Details'}
          </p>
        </div>
        
        <form onSubmit={handleSubmit}>
          {currentStep === 1 && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName" className="form-label">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className={`form-input ${errors.firstName ? 'form-input-error' : ''}`}
                    placeholder="Your first name"
                  />
                  {errors.firstName && (
                    <p className="form-error-message">{errors.firstName}</p>
                  )}
                </div>
                
                <div className="form-group">
                  <label htmlFor="lastName" className="form-label">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className={`form-input ${errors.lastName ? 'form-input-error' : ''}`}
                    placeholder="Your last name"
                  />
                  {errors.lastName && (
                    <p className="form-error-message">{errors.lastName}</p>
                  )}
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`form-input ${errors.email ? 'form-input-error' : ''}`}
                  placeholder="Your email"
                />
                {errors.email && (
                  <p className="form-error-message">{errors.email}</p>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`form-input ${errors.password ? 'form-input-error' : ''}`}
                  placeholder="Create a password"
                />
                {errors.password && (
                  <p className="form-error-message">{errors.password}</p>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`form-input ${errors.confirmPassword ? 'form-input-error' : ''}`}
                  placeholder="Confirm your password"
                />
                {errors.confirmPassword && (
                  <p className="form-error-message">{errors.confirmPassword}</p>
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
                </select>
                <p className="form-help-text">
                  Note: HR accounts require administrator approval
                </p>
              </div>
              
              <button
                type="button"
                onClick={handleNextStep}
                className="form-button form-button-full"
              >
                Next
              </button>
            </>
          )}
          
          {currentStep === 2 && (
            <>
              <div className="form-group">
                <label htmlFor="phoneNumber" className="form-label">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className={`form-input ${errors.phoneNumber ? 'form-input-error' : ''}`}
                  placeholder="Your phone number"
                />
                {errors.phoneNumber && (
                  <p className="form-error-message">{errors.phoneNumber}</p>
                )}
              </div>
              
              {formData.accountType === 'applicant' && (
                <div className="form-group">
                  <label htmlFor="dateOfBirth" className="form-label">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    id="dateOfBirth"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className={`form-input ${errors.dateOfBirth ? 'form-input-error' : ''}`}
                  />
                  {errors.dateOfBirth && (
                    <p className="form-error-message">{errors.dateOfBirth}</p>
                  )}
                </div>
              )}
              
              {formData.accountType === 'hr' && (
                <div className="form-group">
                  <label htmlFor="workingId" className="form-label">
                    Working ID
                  </label>
                  <input
                    type="text"
                    id="workingId"
                    name="workingId"
                    value={formData.workingId}
                    onChange={handleChange}
                    className={`form-input ${errors.workingId ? 'form-input-error' : ''}`}
                    placeholder="Your company ID"
                  />
                  {errors.workingId && (
                    <p className="form-error-message">{errors.workingId}</p>
                  )}
                </div>
              )}
              
              <div className="form-group">
                <label htmlFor="image" className="form-label">
                  Profile Image (Optional)
                </label>
                <div className="form-image-upload">
                  <input
                    type="file"
                    id="image"
                    name="image"
                    accept="image/*"
                    onChange={handleChange}
                    className="form-image-input"
                  />
                  <label
                    htmlFor="image"
                    className="form-image-button"
                  >
                    Choose File
                  </label>
                  {imagePreview && (
                    <div className="form-image-preview">
                      <img
                        src={imagePreview}
                        alt="Profile Preview"
                        className="form-image-preview-img"
                      />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="form-actions">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="form-button form-button-secondary"
                >
                  Back
                </button>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="form-button form-button-primary"
                >
                  {loading ? 'Registering...' : 'Register'}
                </button>
              </div>
            </>
          )}
        </form>
        
        <div className="auth-form-footer">
          <p className="auth-form-footer-text">
            Already have an account?{' '}
            <Link to="/login" className="auth-form-link">
              Log in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;