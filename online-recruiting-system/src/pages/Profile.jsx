import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  User, 
  GraduationCap, 
  Briefcase, 
  Target, 
  Mail, 
  Phone, 
  MapPin,
  Plus,
  Edit,
  Calendar,
  Save,
  X
} from 'lucide-react';
import api from '../services/api';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('personal-info');
  const [isEditing, setIsEditing] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  // Profile data state
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    street: '',
    city: '',
    postalCode: '',
    workingId: ''
  });
  
  // Education, experience, and preferences data states
  const [education, setEducation] = useState([]);
  const [experience, setExperience] = useState([]);
  const [preferences, setPreferences] = useState([]);
  
  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Fetch user profile data on component mount
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        
        // Fetch personal info
        const response = await api.get('/profile/personal-info');
        setProfileData(response.data.data || {});
        
        // If user is an applicant, fetch related data
        if (user && user.accountType === 'applicant') {
          // Fetch education records
          const educationResponse = await api.get('/profile/education');
          setEducation(educationResponse.data.data || []);
          
          // Fetch work experience
          const experienceResponse = await api.get('/profile/experience');
          setExperience(experienceResponse.data.data || []);
          
          // Fetch job preferences
          const preferencesResponse = await api.get('/profile/preferences');
          setPreferences(preferencesResponse.data.data || []);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching profile data:', err);
        setError('Failed to load profile data. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchProfileData();
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData({ ...profileData, [name]: value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      
      // Create a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Discard changes
      setIsEditing(false);
      setImageFile(null);
      setImagePreview(null);
    } else {
      setIsEditing(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      // Handle image upload if needed
      if (imageFile) {
        const formData = new FormData();
        formData.append('profileImage', imageFile);
        await api.post('/profile/image', formData);
      }
      
      // Prepare data - ensure all fields from profileData are included
      const dataToSend = {
        firstName: profileData.firstName || '',
        lastName: profileData.lastName || '',
        email: profileData.email,
        phoneNumber: profileData.phoneNumber || '',
        dateOfBirth: profileData.dateOfBirth || '',
        street: profileData.street || '',
        city: profileData.city || '',
        postalCode: profileData.postalCode || '',
        // Include company name for HR accounts
        ...(user?.accountType === 'hr' ? { companyName: profileData.companyName || '' } : {})
      };
      
      console.log('Sending profile data:', JSON.stringify(dataToSend, null, 2));
      
      // Send the request
      const response = await api.put('/profile/personal-info', dataToSend);
      console.log('Profile update response:', response);
      
      // Update auth context with full data
      if (updateProfile) {
        try {
          await updateProfile({
            firstName: dataToSend.firstName,
            lastName: dataToSend.lastName,
            // You can add more fields here if needed in the auth context
          });
        } catch (err) {
          console.error('Error updating context:', err);
        }
      }
      
      setSaving(false);
      setIsEditing(false);
      setImageFile(null);
      
      // Show success message
      alert('Profile updated successfully');
      
      // Instead of full page reload, just refresh the profile data
      const fetchProfileData = async () => {
        try {
          setLoading(true);
          
          // Fetch personal info
          const refreshResponse = await api.get('/profile/personal-info');
          const profileData = refreshResponse.data.data || {};
          
          // Format date of birth to yyyy-MM-dd format
          if (profileData.dateOfBirth) {
            // Extract just the date part from the ISO string
            profileData.dateOfBirth = profileData.dateOfBirth.split('T')[0];
          }
          
          // Now set the formatted data
          setProfileData(profileData);
          
          // If user is an applicant, fetch related data
          if (user && user.accountType === 'applicant') {
            // Fetch education records
            const educationResponse = await api.get('/profile/education');
            setEducation(educationResponse.data.data || []);
            
            // Fetch work experience
            const experienceResponse = await api.get('/profile/experience');
            setExperience(experienceResponse.data.data || []);
            
            // Fetch job preferences
            const preferencesResponse = await api.get('/profile/preferences');
            setPreferences(preferencesResponse.data.data || []);
          }
          
          setLoading(false);
        } catch (err) {
          console.error('Error fetching profile data:', err);
          setError('Failed to load profile data. Please try again later.');
          setLoading(false);
        }
      };
      
      fetchProfileData();
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
      setSaving(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (e) {
      return dateString;
    }
  };

  // Delete education record
  const handleDeleteEducation = async (id) => {
    if (window.confirm('Are you sure you want to delete this education record?')) {
      try {
        await api.delete(`/profile/education/${id}`);
        setEducation(education.filter(item => item.id !== id));
        alert('Education record deleted successfully');
      } catch (err) {
        console.error('Error deleting education:', err);
        setError('Failed to delete education record');
      }
    }
  };

  // Delete work experience
  const handleDeleteExperience = async (id) => {
    if (window.confirm('Are you sure you want to delete this work experience?')) {
      try {
        await api.delete(`/profile/experience/${id}`);
        setExperience(experience.filter(item => item.id !== id));
        alert('Work experience deleted successfully');
      } catch (err) {
        console.error('Error deleting work experience:', err);
        setError('Failed to delete work experience');
      }
    }
  };

  // Delete job preference
  const handleDeletePreference = async (id) => {
    if (window.confirm('Are you sure you want to delete this job preference?')) {
      try {
        await api.delete(`/profile/preferences/${id}`);
        setPreferences(preferences.filter(item => item.id !== id));
        alert('Job preference deleted successfully');
      } catch (err) {
        console.error('Error deleting job preference:', err);
        setError('Failed to delete job preference');
      }
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1 className="page-title">My Profile</h1>
      
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)} className="error-dismiss">
            <X size={16} />
          </button>
        </div>
      )}
      
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-avatar-container">
            {isEditing ? (
              <div className="profile-avatar-edit">
                <label htmlFor="profile-image" className="profile-image-label">
                  {imagePreview ? (
                    <img 
                      src={imagePreview} 
                      alt="Profile Preview" 
                      className="profile-avatar profile-preview" 
                    />
                  ) : (
                    <img 
                      src={user?.imagePath || '/images/default-avatar.png'} 
                      alt="Profile" 
                      className="profile-avatar" 
                    />
                  )}
                  <span className="profile-image-overlay">
                    <Edit size={24} />
                    <span>Change Image</span>
                  </span>
                </label>
                <input 
                  type="file" 
                  id="profile-image" 
                  accept="image/*" 
                  onChange={handleImageChange} 
                  className="profile-image-input" 
                />
              </div>
            ) : (
              <img 
                src={user?.imagePath || '/images/default-avatar.png'} 
                alt="Profile" 
                className="profile-avatar" 
              />
            )}
          </div>
          
          <div className="profile-user-info">
            <h2 className="profile-user-name">{profileData.firstName} {profileData.lastName}</h2>
            <p className="profile-user-email">{profileData.email}</p>
            <p className="profile-user-type">
              {user?.accountType === 'applicant' 
                ? 'Job Seeker' 
                : user?.accountType === 'hr' 
                  ? 'HR Staff' 
                  : 'Administrator'}
            </p>
            {!isEditing && (
              <button 
                onClick={handleEditToggle} 
                className="profile-edit-button"
              >
                <Edit size={16} /> Edit Profile
              </button>
            )}
          </div>
        </div>
        
        <div className="profile-tabs">
          <button 
            className={`tab-button ${activeTab === 'personal-info' ? 'active' : ''}`}
            onClick={() => setActiveTab('personal-info')}
          >
            <User size={16} />
            Personal Info
          </button>
          
          {user?.accountType === 'applicant' && (
            <>
              <button 
                className={`tab-button ${activeTab === 'education' ? 'active' : ''}`}
                onClick={() => setActiveTab('education')}
              >
                <GraduationCap size={16} />
                Education
              </button>
              <button 
                className={`tab-button ${activeTab === 'work-experience' ? 'active' : ''}`}
                onClick={() => setActiveTab('work-experience')}
              >
                <Briefcase size={16} />
                Work Experience
              </button>
              <button 
                className={`tab-button ${activeTab === 'job-preferences' ? 'active' : ''}`}
                onClick={() => setActiveTab('job-preferences')}
              >
                <Target size={16} />
                Job Preferences
              </button>
            </>
          )}
        </div>
        
        <div className="profile-content">
          {activeTab === 'personal-info' && (
            <div className="profile-section">
              <div className="profile-section-header">
                <h3 className="profile-section-title">Personal Information</h3>
                {isEditing && (
                  <div className="profile-edit-actions">
                    <button onClick={handleEditToggle} className="profile-cancel-button">
                      Cancel
                    </button>
                    <button 
                      onClick={handleSubmit} 
                      disabled={saving} 
                      className="profile-save-button"
                    >
                      {saving ? (
                        <>
                          <div className="button-spinner"></div> Saving...
                        </>
                      ) : (
                        <>
                          <Save size={16} /> Save Changes
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
              
              {isEditing ? (
                <form className="profile-form" onSubmit={handleSubmit}>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="firstName" className="form-label">First Name</label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={profileData.firstName || ''}
                        onChange={handleInputChange}
                        className="form-input"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="lastName" className="form-label">Last Name</label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={profileData.lastName || ''}
                        onChange={handleInputChange}
                        className="form-input"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="email" className="form-label">Email Address</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={profileData.email || ''}
                        onChange={handleInputChange}
                        className="form-input"
                        required
                        disabled
                      />
                      <div className="form-help-text">Email cannot be changed</div>
                    </div>
                    <div className="form-group">
                      <label htmlFor="phoneNumber" className="form-label">Phone Number</label>
                      <input
                        type="tel"
                        id="phoneNumber"
                        name="phoneNumber"
                        value={profileData.phoneNumber || ''}
                        onChange={handleInputChange}
                        className="form-input"
                      />
                    </div>
                  </div>
                  
                  {user?.accountType === 'applicant' && (
                    <>
                      <div className="form-row">
                        <div className="form-group">
                          <label htmlFor="dateOfBirth" className="form-label">Date of Birth</label>
                          <input
                            type="date"
                            id="dateOfBirth"
                            name="dateOfBirth"
                            value={profileData.dateOfBirth || ''}
                            onChange={handleInputChange}
                            className="form-input"
                          />
                        </div>
                      </div>
                      
                      <div className="form-row">
                        <div className="form-group">
                          <label htmlFor="street" className="form-label">Street Address</label>
                          <input
                            type="text"
                            id="street"
                            name="street"
                            value={profileData.street || ''}
                            onChange={handleInputChange}
                            className="form-input"
                          />
                        </div>
                      </div>
                      
                      <div className="form-row">
                        <div className="form-group">
                          <label htmlFor="city" className="form-label">City</label>
                          <input
                            type="text"
                            id="city"
                            name="city"
                            value={profileData.city || ''}
                            onChange={handleInputChange}
                            className="form-input"
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="postalCode" className="form-label">Postal Code</label>
                          <input
                            type="text"
                            id="postalCode"
                            name="postalCode"
                            value={profileData.postalCode || ''}
                            onChange={handleInputChange}
                            className="form-input"
                          />
                        </div>
                      </div>
                    </>
                  )}
                  
                  {user?.accountType === 'hr' && (
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="workingId" className="form-label">Working ID</label>
                        <input
                          type="text"
                          id="workingId"
                          name="workingId"
                          value={profileData.workingId || ''}
                          onChange={handleInputChange}
                          className="form-input"
                          disabled
                        />
                        <div className="form-help-text">Working ID cannot be changed</div>
                      </div>
                    </div>
                  )}
                </form>
              ) : (
                <div className="profile-info-grid">
                  <div className="profile-info-item">
                    <div className="profile-info-label">
                      <User size={16} /> First Name
                    </div>
                    <div className="profile-info-value">{profileData.firstName || 'Not provided'}</div>
                  </div>
                  
                  <div className="profile-info-item">
                    <div className="profile-info-label">
                      <User size={16} /> Last Name
                    </div>
                    <div className="profile-info-value">{profileData.lastName || 'Not provided'}</div>
                  </div>
                  
                  <div className="profile-info-item">
                    <div className="profile-info-label">
                      <Mail size={16} /> Email
                    </div>
                    <div className="profile-info-value">{profileData.email || 'Not provided'}</div>
                  </div>
                  
                  <div className="profile-info-item">
                    <div className="profile-info-label">
                      <Phone size={16} /> Phone Number
                    </div>
                    <div className="profile-info-value">{profileData.phoneNumber || 'Not provided'}</div>
                  </div>
                  
                  {user?.accountType === 'applicant' && (
                    <>
                      <div className="profile-info-item">
                        <div className="profile-info-label">
                          <Calendar size={16} /> Date of Birth
                        </div>
                        <div className="profile-info-value">
                          {profileData.dateOfBirth ? formatDate(profileData.dateOfBirth) : 'Not provided'}
                        </div>
                      </div>
                      
                      <div className="profile-info-item">
                        <div className="profile-info-label">
                          <MapPin size={16} /> Address
                        </div>
                        <div className="profile-info-value">
                          {profileData.street || profileData.city ? (
                            <>
                              {profileData.street && <div>{profileData.street}</div>}
                              {(profileData.city || profileData.postalCode) && (
                                <div>
                                  {profileData.city}{profileData.city && profileData.postalCode && ', '}
                                  {profileData.postalCode}
                                </div>
                              )}
                            </>
                          ) : (
                            'Not provided'
                          )}
                        </div>
                      </div>
                    </>
                  )}
                  
                  {user?.accountType === 'hr' && (
                    <div className="profile-info-item">
                      <div className="profile-info-label">
                        <Briefcase size={16} /> Working ID
                      </div>
                      <div className="profile-info-value">{profileData.workingId || 'Not provided'}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'education' && (
            <div className="profile-section">
              <div className="profile-section-header">
                <h3 className="profile-section-title">Education</h3>
                <Link to="/profile/education/add" className="profile-add-button">
                  <Plus size={16} /> Add Education
                </Link>
              </div>
              
              {education.length === 0 ? (
                <div className="profile-empty-state">
                  <GraduationCap size={48} className="profile-empty-icon" />
                  <h4>No education records</h4>
                  <p>Add your education details to improve job matching.</p>
                  <Link to="/profile/education/add" className="profile-add-link">
                    Add Education
                  </Link>
                </div>
              ) : (
                <div className="profile-list">
                  {education.map(item => (
                    <div key={item.id} className="profile-list-item">
                      <div className="profile-list-content">
                        <h4 className="profile-list-title">
                          {item.degreeLevel} in {item.fieldOfStudy}
                        </h4>
                        <div className="profile-list-subtitle">{item.institution}</div>
                        <div className="profile-list-meta">
                          {formatDate(item.startDate)} - {formatDate(item.endDate)}
                        </div>
                        {item.gpa && (
                          <div className="profile-list-detail">
                            GPA: {item.gpa}
                          </div>
                        )}
                      </div>
                      <div className="profile-list-actions">
                        <Link 
                          to={`/profile/education/edit/${item.id}`} 
                          className="profile-list-button profile-list-edit"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDeleteEducation(item.id)}
                          className="profile-list-button profile-list-delete"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'work-experience' && (
            <div className="profile-section">
              <div className="profile-section-header">
                <h3 className="profile-section-title">Work Experience</h3>
                <Link to="/profile/experience/add" className="profile-add-button">
                  <Plus size={16} /> Add Experience
                </Link>
              </div>
              
              {experience.length === 0 ? (
                <div className="profile-empty-state">
                  <Briefcase size={48} className="profile-empty-icon" />
                  <h4>No work experience</h4>
                  <p>Add your work history to improve job matching.</p>
                  <Link to="/profile/experience/add" className="profile-add-link">
                    Add Work Experience
                  </Link>
                </div>
              ) : (
                <div className="profile-list">
                  {experience.map(item => (
                    <div key={item.id} className="profile-list-item">
                      <div className="profile-list-content">
                        <h4 className="profile-list-title">{item.jobTitle}</h4>
                        <div className="profile-list-subtitle">{item.company}</div>
                        <div className="profile-list-meta">
                          {formatDate(item.startDate)} - {item.currentJob ? 'Present' : formatDate(item.endDate)}
                        </div>
                        <div className="profile-list-detail">
                          {item.responsibilities}
                        </div>
                        {item.skills && (
                          <div className="profile-list-skills">
                            <strong>Skills:</strong> {item.skills}
                          </div>
                        )}
                      </div>
                      <div className="profile-list-actions">
                        <Link 
                          to={`/profile/experience/edit/${item.id}`} 
                          className="profile-list-button profile-list-edit"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDeleteExperience(item.id)}
                          className="profile-list-button profile-list-delete"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'job-preferences' && (
            <div className="profile-section">
              <div className="profile-section-header">
                <h3 className="profile-section-title">Job Preferences</h3>
                <Link to="/profile/preferences/add" className="profile-add-button">
                  <Plus size={16} /> Add Preference
                </Link>
              </div>
              
              {preferences.length === 0 ? (
                <div className="profile-empty-state">
                  <Target size={48} className="profile-empty-icon" />
                  <h4>No job preferences</h4>
                  <p>Add your job preferences to get matched with suitable positions.</p>
                  <Link to="/profile/preferences/add" className="profile-add-link">
                    Add Job Preference
                  </Link>
                </div>
              ) : (
                <div className="profile-list">
                  {preferences.map(item => (
                    <div key={item.id} className="profile-list-item">
                      <div className="profile-list-content">
                        <h4 className="profile-list-title">
                          {item.category} - {item.positionType}
                        </h4>
                        <div className="profile-list-subtitle">{item.location}</div>
                        <div className="profile-list-detail">
                          <strong>Minimum Salary:</strong> {item.minSalary 
                            ? `$${parseInt(item.minSalary).toLocaleString()}` 
                            : 'Not specified'}
                        </div>
                        {item.keywords && (
                          <div className="profile-list-detail">
                            <strong>Keywords:</strong> {item.keywords}
                          </div>
                        )}
                      </div>
                      <div className="profile-list-actions">
                        <Link 
                          to={`/profile/preferences/edit/${item.id}`} 
                          className="profile-list-button profile-list-edit"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDeletePreference(item.id)}
                          className="profile-list-button profile-list-delete"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;