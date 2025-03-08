import React, { useState } from 'react';
import PersonalInfo from '../components/profile/PersonalInfo';
import Education from '../components/profile/Education';
import WorkExperience from '../components/profile/WorkExperience';
import JobPreferences from '../components/profile/JobPreferences';
import '../styles/profile.css';

const Profile = () => {
  const [activeTab, setActiveTab] = useState('personal-info');

  return (
    <main className="container">
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
    </main>
  );
};

export default Profile;