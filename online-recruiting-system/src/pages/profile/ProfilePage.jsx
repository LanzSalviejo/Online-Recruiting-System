import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  User, 
  GraduationCap, 
  Briefcase, 
  Target, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin,
  Plus
} from 'lucide-react';
import api from '../../services/api';

const ProfilePage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('personal-info');
  const [profile, setProfile] = useState(null);
  const [education, setEducation] = useState([]);
  const [experience, setExperience] = useState([]);
  const [preferences, setPreferences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        
        // Fetch personal info
        const personalInfoResponse = await api.get('/profile/personal-info');
        setProfile(personalInfoResponse.data.data);
        
        // If user is an applicant, fetch additional profile sections
        if (user && user.accountType === 'applicant') {
          // Fetch education
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

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Education level sorting order
  const educationOrder = {
    'High School': 1,
    'Diploma': 2,
    'Associate': 3,
    'Bachelor': 4,
    'Master': 5,
    'PhD': 6
  };
  
  // Sort education by level (highest first) and then by end date (most recent first)
  const sortedEducation = [...education].sort((a, b) => {
    const levelDiff = (educationOrder[b.degreeLevel] || 0) - (educationOrder[a.degreeLevel] || 0);
    if (levelDiff !== 0) return levelDiff;
    
    const dateA = new Date(a.endDate || '2000-01-01');
    const dateB = new Date(b.endDate || '2000-01-01');
    return dateB - dateA;
  });
  
  // Sort experience by start date (most recent first)
  const sortedExperience = [...experience].sort((a, b) => {
    const dateA = new Date(a.startDate || '2000-01-01');
    const dateB = new Date(b.startDate || '2000-01-01');
    return dateB - dateA;
  });

  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-container">
        <div className="error-message">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-photo-container">
          <img 
            src={profile?.imagePath || '/images/default-avatar.png'} 
            alt="Profile" 
            className="profile-photo"
          />
          <label className="profile-photo-edit">
            <input 
              type="file" 
              accept="image/*" 
              style={{ display: 'none' }} 
              // Handle profile image upload
            />
            <span><User size={16} /></span>
          </label>
        </div>
        
        <div className="profile-info">
          <h1 className="profile-name">{profile?.firstName} {profile?.lastName}</h1>
          <p className="profile-role">{user?.accountType === 'applicant' ? 'Job Seeker' : user?.accountType === 'hr' ? 'HR Professional' : 'Administrator'}</p>
          
          <div className="profile-contact">
            <div className="profile-contact-item">
              <Mail size={16} className="profile-contact-icon" />
              {profile?.email}
            </div>
            {profile?.phoneNumber && (
              <div className="profile-contact-item">
                <Phone size={16} className="profile-contact-icon" />
                {profile.phoneNumber}
              </div>
            )}
            {profile?.city && (
              <div className="profile-contact-item">
                <MapPin size={16} className="profile-contact-icon" />
                {profile.city}
              </div>
            )}
          </div>
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
          <div id="personal-info" className="profile-section">
            <div className="profile-section-header">
              <h2 className="profile-section-title">Personal Information</h2>
              <Link to="/profile/edit" className="profile-section-action">
                Edit
              </Link>
            </div>
            
            <div className="profile-grid">
              <div className="profile-field">
                <div className="profile-field-label">First Name</div>
                <div className="profile-field-value">{profile?.firstName || 'Not provided'}</div>
              </div>
              <div className="profile-field">
                <div className="profile-field-label">Last Name</div>
                <div className="profile-field-value">{profile?.lastName || 'Not provided'}</div>
              </div>
              <div className="profile-field">
                <div className="profile-field-label">Email</div>
                <div className="profile-field-value">{profile?.email || 'Not provided'}</div>
              </div>
              <div className="profile-field">
                <div className="profile-field-label">Phone Number</div>
                <div className="profile-field-value">{profile?.phoneNumber || 'Not provided'}</div>
              </div>
              {user?.accountType === 'applicant' && (
                <>
                  <div className="profile-field">
                    <div className="profile-field-label">Date of Birth</div>
                    <div className="profile-field-value">
                      {profile?.dateOfBirth ? formatDate(profile.dateOfBirth) : 'Not provided'}
                    </div>
                  </div>
                  <div className="profile-field">
                    <div className="profile-field-label">Address</div>
                    <div className="profile-field-value">
                      {profile?.street ? `${profile.street}, ${profile.city || ''} ${profile.postalCode || ''}` : 'Not provided'}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'education' && (
          <div id="education" className="profile-section">
            <div className="profile-section-header">
              <h2 className="profile-section-title">Education</h2>
              <Link to="/profile/education" className="profile-section-action">
                <Plus size={16} /> Add Education
              </Link>
            </div>
            
            {sortedEducation.length === 0 ? (
              <div className="profile-section-empty">
                No education records found. Add your education details to improve job matching.
              </div>
            ) : (
              sortedEducation.map(edu => (
                <div key={edu.id} className="profile-list-item">
                  <div className="profile-list-item-header">
                    <div>
                      <div className="profile-list-item-title">
                        {edu.degreeLevel} in {edu.fieldOfStudy}
                      </div>
                      <div className="profile-list-item-subtitle">{edu.institution}</div>
                      <div className="profile-list-item-dates">
                        {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                      </div>
                    </div>
                    <div className="profile-list-item-actions">
                      <Link 
                        to={`/profile/education/${edu.id}`}
                        className="profile-list-item-action-button"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                  {edu.gpa && <div className="profile-list-item-detail">GPA: {edu.gpa}</div>}
                </div>
              ))
            )}
          </div>
        )}
        
        {activeTab === 'work-experience' && (
          <div id="work-experience" className="profile-section">
            <div className="profile-section-header">
              <h2 className="profile-section-title">Work Experience</h2>
              <Link to="/profile/experience" className="profile-section-action">
                <Plus size={16} /> Add Experience
              </Link>
            </div>
            
            {sortedExperience.length === 0 ? (
              <div className="profile-section-empty">
                No work experience records found. Add your work history to improve job matching.
              </div>
            ) : (
              sortedExperience.map(exp => (
                <div key={exp.id} className="profile-list-item">
                  <div className="profile-list-item-header">
                    <div>
                      <div className="profile-list-item-title">
                        {exp.jobTitle}
                      </div>
                      <div className="profile-list-item-subtitle">{exp.company} • {exp.industry}</div>
                      <div className="profile-list-item-dates">
                        {formatDate(exp.startDate)} - {exp.currentJob ? 'Present' : formatDate(exp.endDate)}
                      </div>
                    </div>
                    <div className="profile-list-item-actions">
                      <Link 
                        to={`/profile/experience/${exp.id}`}
                        className="profile-list-item-action-button"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                  <div className="profile-list-item-detail">{exp.responsibilities}</div>
                  {exp.skills && (
                    <div className="profile-list-item-skills">
                      <strong>Skills:</strong> {exp.skills}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
        
        {activeTab === 'job-preferences' && (
          <div id="job-preferences" className="profile-section">
            <div className="profile-section-header">
              <h2 className="profile-section-title">Job Preferences</h2>
              <Link to="/profile/preferences" className="profile-section-action">
                <Plus size={16} /> Add Preference
              </Link>
            </div>
            
            {preferences.length === 0 ? (
              <div className="profile-section-empty">
                No job preferences found. Add your job preferences to get matched with suitable positions.
              </div>
            ) : (
              preferences.map(pref => (
                <div key={pref.id} className="profile-list-item">
                  <div className="profile-list-item-header">
                    <div>
                      <div className="profile-list-item-title">
                        {pref.category} - {pref.positionType}
                      </div>
                      <div className="profile-list-item-subtitle">{pref.location}</div>
                    </div>
                    <div className="profile-list-item-actions">
                      <Link 
                        to={`/profile/preferences/${pref.id}`}
                        className="profile-list-item-action-button"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                  <div className="profile-list-item-detail">
                    <strong>Minimum Salary:</strong> ${pref.minSalary ? pref.minSalary.toLocaleString() : 'Not specified'}
                  </div>
                  {pref.keywords && (
                    <div className="profile-list-item-detail">
                      <strong>Keywords:</strong> {pref.keywords}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;