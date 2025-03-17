import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Create placeholder components if originals don't exist
const DefaultComponent = ({ title }) => (
  <div className="profile-section">
    <h3>{title}</h3>
    <p>This section is under development. It will be implemented soon.</p>
  </div>
);

// Import existing components, or use placeholders if they don't exist yet
const PersonalInfo = () => <DefaultComponent title="Personal Information" />;
const Education = () => <DefaultComponent title="Education" />;
const WorkExperience = () => <DefaultComponent title="Work Experience" />;
const JobPreferences = () => <DefaultComponent title="Job Preferences" />;

const Profile = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('personal-info');

  return (
    <div className="page-container">
      <h1 className="page-title">My Profile</h1>
      
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-avatar">
            {user?.imagePath ? (
              <img src={user.imagePath} alt={`${user.firstName} ${user.lastName}`} />
            ) : (
              <div className="profile-avatar-initials">
                {user?.firstName?.charAt(0) || 'U'}{user?.lastName?.charAt(0) || ''}
              </div>
            )}
          </div>
          <div className="profile-user-info">
            <h2 className="profile-user-name">{user?.firstName} {user?.lastName}</h2>
            <p className="profile-user-email">{user?.email}</p>
            <p className="profile-user-account-type">
              Account Type: {user?.accountType || 'User'}
            </p>
          </div>
        </div>
        
        <div className="profile-tabs">
          <button 
            className={`tab-button ${activeTab === 'personal-info' ? 'active' : ''}`}
            onClick={() => setActiveTab('personal-info')}
          >
            Personal Info
          </button>
          <button 
            className={`tab-button ${activeTab === 'education' ? 'active' : ''}`}
            onClick={() => setActiveTab('education')}
          >
            Education
          </button>
          <button 
            className={`tab-button ${activeTab === 'work-experience' ? 'active' : ''}`}
            onClick={() => setActiveTab('work-experience')}
          >
            Work Experience
          </button>
          <button 
            className={`tab-button ${activeTab === 'job-preferences' ? 'active' : ''}`}
            onClick={() => setActiveTab('job-preferences')}
          >
            Job Preferences
          </button>
        </div>
        
        <div className="profile-content">
          {activeTab === 'personal-info' && <PersonalInfo />}
          {activeTab === 'education' && <Education />}
          {activeTab === 'work-experience' && <WorkExperience />}
          {activeTab === 'job-preferences' && <JobPreferences />}
        </div>
      </div>
    </div>
  );
};

export default Profile;