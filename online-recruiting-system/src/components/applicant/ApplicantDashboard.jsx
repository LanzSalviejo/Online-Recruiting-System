import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Briefcase, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Bell, 
  Search,
  BookOpen,
  Building,
  Star
} from 'lucide-react';
import api from '../../services/api';

const ApplicantDashboard = ({ user }) => {
  const [stats, setStats] = useState({
    totalApplications: 0,
    pendingApplications: 0,
    interviewInvitations: 0,
    rejectedApplications: 0
  });
  
  const [recentApplications, setRecentApplications] = useState([]);
  const [jobRecommendations, setJobRecommendations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch applicant data from database on component mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch stats
        const statsResponse = await api.get('/applicant/stats');
        setStats(statsResponse.data);
        
        // Fetch recent applications
        const applicationsResponse = await api.get('/applicant/applications/recent');
        setRecentApplications(applicationsResponse.data);
        
        // Fetch job recommendations
        const recommendationsResponse = await api.get('/applicant/recommendations');
        setJobRecommendations(recommendationsResponse.data);
        
        // Fetch notifications
        const notificationsResponse = await api.get('/applicant/notifications');
        setNotifications(notificationsResponse.data);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  // Format date to readable format
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message">
        {error}
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-welcome">
        <h2 className="dashboard-title">Welcome, {user.firstName}!</h2>
      </div>
      
      <div className="stats-grid">
        <div className="stat-card stat-card-blue">
          <div className="stat-icon-container stat-icon-blue">
            <Briefcase size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-title">Total Applications</p>
            <p className="stat-value">{stats.totalApplications}</p>
          </div>
        </div>
        
        <div className="stat-card stat-card-yellow">
          <div className="stat-icon-container stat-icon-yellow">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-title">Pending</p>
            <p className="stat-value">{stats.pendingApplications}</p>
          </div>
        </div>
        
        <div className="stat-card stat-card-green">
          <div className="stat-icon-container stat-icon-green">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-title">Interview Invitations</p>
            <p className="stat-value">{stats.interviewInvitations}</p>
          </div>
        </div>
        
        <div className="stat-card stat-card-red">
          <div className="stat-icon-container stat-icon-red">
            <AlertCircle size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-title">Rejected</p>
            <p className="stat-value">{stats.rejectedApplications}</p>
          </div>
        </div>
      </div>
      
      <div className="dashboard-grid">
        <div className="dashboard-main">
          <div className="dashboard-section">
            <div className="dashboard-section-header">
              <h3 className="dashboard-section-title">Recent Applications</h3>
              <Link to="/applications" className="dashboard-section-link">
                View All
              </Link>
            </div>
            
            <div className="dashboard-section-content">
              {recentApplications.length > 0 ? (
                <div className="dashboard-list">
                  {recentApplications.map(application => (
                    <div key={application._id} className="dashboard-list-item">
                      <div className="dashboard-list-item-content">
                        <h4 className="dashboard-list-item-title">{application.jobTitle}</h4>
                        <p className="dashboard-list-item-subtitle">{application.companyName}</p>
                        <div className="dashboard-list-item-meta">
                          <span className="dashboard-list-item-date">Applied: {formatDate(application.applicationDate)}</span>
                          <span className={`application-status application-status-${application.status.toLowerCase().replace(/\s+/g, '-')}`}>
                            {application.status}
                          </span>
                        </div>
                      </div>
                      <Link 
                        to={`/applications/${application._id}`}
                        className="dashboard-list-item-action"
                      >
                        Details
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="dashboard-section-empty">
                  <Briefcase size={40} className="dashboard-section-empty-icon" />
                  <p className="dashboard-section-empty-text">You haven't applied to any jobs yet.</p>
                  <Link 
                    to="/jobs" 
                    className="dashboard-primary-button"
                  >
                    Browse Jobs
                  </Link>
                </div>
              )}
            </div>
          </div>
          
          <div className="dashboard-section">
            <div className="dashboard-section-header">
              <h3 className="dashboard-section-title">Complete Your Profile</h3>
              <Link to="/profile" className="dashboard-section-link">
                Edit Profile
              </Link>
            </div>
            
            <div className="profile-completion-grid">
              <div className="profile-completion-item profile-completion-complete">
                <div className="profile-completion-icon">
                  <CheckCircle size={20} />
                </div>
                <div className="profile-completion-content">
                  <h4 className="profile-completion-title">Basic Information</h4>
                  <p className="profile-completion-subtitle">Personal details and contact information</p>
                </div>
              </div>
              
              <div className="profile-completion-item profile-completion-incomplete">
                <div className="profile-completion-icon">
                  <BookOpen size={20} />
                </div>
                <div className="profile-completion-content">
                  <h4 className="profile-completion-title">Education Details</h4>
                  <p className="profile-completion-subtitle">Add your educational background</p>
                </div>
                <Link to="/profile/education" className="profile-completion-action">Add</Link>
              </div>
              
              <div className="profile-completion-item profile-completion-incomplete">
                <div className="profile-completion-icon">
                  <Building size={20} />
                </div>
                <div className="profile-completion-content">
                  <h4 className="profile-completion-title">Work Experience</h4>
                  <p className="profile-completion-subtitle">Add your work history</p>
                </div>
                <Link to="/profile/experience" className="profile-completion-action">Add</Link>
              </div>
              
              <div className="profile-completion-item profile-completion-incomplete">
                <div className="profile-completion-icon">
                  <Star size={20} />
                </div>
                <div className="profile-completion-content">
                  <h4 className="profile-completion-title">Job Preferences</h4>
                  <p className="profile-completion-subtitle">Set your job preferences for recommendations</p>
                </div>
                <Link to="/profile/preferences" className="profile-completion-action">Add</Link>
              </div>
            </div>
            
            <div className="profile-completion-progress">
              <p className="profile-completion-text">Profile completion: 25%</p>
              <div className="profile-completion-bar">
                <div className="profile-completion-fill" style={{ width: '25%' }}></div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="dashboard-sidebar">
          <div className="dashboard-section">
            <div className="dashboard-section-header">
              <h3 className="dashboard-section-title">Job Recommendations</h3>
              <Link to="/jobs" className="dashboard-section-link">
                Browse All
              </Link>
            </div>
            
            <div className="dashboard-section-content">
              {jobRecommendations.length > 0 ? (
                <div className="dashboard-list">
                  {jobRecommendations.map(job => (
                    <Link key={job._id} to={`/jobs/${job._id}`} className="recommendation-item">
                      <div className="recommendation-content">
                        <h4 className="recommendation-title">{job.title}</h4>
                        <p className="recommendation-company">{job.companyName}</p>
                        <p className="recommendation-location">{job.location}</p>
                      </div>
                      <span className="recommendation-match">
                        {job.matchScore}% Match
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="dashboard-section-empty">
                  <Search size={40} className="dashboard-section-empty-icon" />
                  <p className="dashboard-section-empty-text">Complete your profile to get job recommendations</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="dashboard-section">
            <div className="dashboard-section-header">
              <h3 className="dashboard-section-title">Notifications</h3>
              <button className="dashboard-section-button">
                Mark All as Read
              </button>
            </div>
            
            <div className="dashboard-section-content">
              {notifications.length > 0 ? (
                <div className="notifications-list">
                  {notifications.map(notification => (
                    <div 
                      key={notification._id} 
                      className={`notification-item ${notification.read ? '' : 'notification-unread'}`}
                    >
                      <div className={`notification-icon notification-icon-${notification.type}`}>
                        {notification.type === 'interview' ? (
                          <CheckCircle size={16} />
                        ) : notification.type === 'jobMatch' ? (
                          <Briefcase size={16} />
                        ) : (
                          <Bell size={16} />
                        )}
                      </div>
                      <div className="notification-content">
                        <p className="notification-message">{notification.message}</p>
                        <p className="notification-date">{formatDate(notification.date)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="dashboard-section-empty">
                  <Bell size={40} className="dashboard-section-empty-icon" />
                  <p className="dashboard-section-empty-text">No notifications yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicantDashboard;