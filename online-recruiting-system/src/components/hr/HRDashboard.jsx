import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  FileText, 
  UserCheck, 
  BarChart2, 
  Inbox,
  Plus,
  Calendar
} from 'lucide-react';
import api from '../../services/api';

const HRDashboard = ({ user }) => {
  const [stats, setStats] = useState({
    activeJobs: 0,
    totalApplications: 0,
    newApplications: 0,
    interviewScheduled: 0
  });
  
  const [recentJobs, setRecentJobs] = useState([]);
  const [recentApplications, setRecentApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch HR data from database on component mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch stats
        const statsResponse = await api.get('/hr/stats');
        setStats(statsResponse.data);
        
        // Fetch recent job postings
        const jobsResponse = await api.get('/hr/jobs/recent');
        setRecentJobs(jobsResponse.data);
        
        // Fetch recent applications
        const applicationsResponse = await api.get('/hr/applications/recent');
        setRecentApplications(applicationsResponse.data);
        
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
      <div className="dashboard-header">
        <h2 className="dashboard-title">HR Dashboard</h2>
        
        <div className="dashboard-actions">
          <Link 
            to="/post-job" 
            className="dashboard-action-button dashboard-action-primary"
          >
            <Plus size={18} className="dashboard-action-icon" />
            Post New Job
          </Link>
          
          <Link 
            to="/applications-review" 
            className="dashboard-action-button dashboard-action-secondary"
          >
            <Inbox size={18} className="dashboard-action-icon" />
            Review Applications
          </Link>
        </div>
      </div>
      
      <div className="stats-grid">
        <div className="stat-card stat-card-blue">
          <div className="stat-icon-container stat-icon-blue">
            <FileText size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-title">Active Job Posts</p>
            <p className="stat-value">{stats.activeJobs}</p>
          </div>
        </div>
        
        <div className="stat-card stat-card-purple">
          <div className="stat-icon-container stat-icon-purple">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-title">Total Applications</p>
            <p className="stat-value">{stats.totalApplications}</p>
          </div>
        </div>
        
        <div className="stat-card stat-card-yellow">
          <div className="stat-icon-container stat-icon-yellow">
            <Inbox size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-title">New Applications</p>
            <p className="stat-value">{stats.newApplications}</p>
          </div>
        </div>
        
        <div className="stat-card stat-card-green">
          <div className="stat-icon-container stat-icon-green">
            <Calendar size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-title">Interviews Scheduled</p>
            <p className="stat-value">{stats.interviewScheduled}</p>
          </div>
        </div>
      </div>
      
      <div className="dashboard-grid">
        <div className="dashboard-section">
          <div className="dashboard-section-header">
            <h3 className="dashboard-section-title">Recent Job Postings</h3>
            <Link to="/job-postings" className="dashboard-section-link">
              View All
            </Link>
          </div>
          
          <div className="dashboard-section-content">
            {recentJobs.length > 0 ? (
              <div className="dashboard-list">
                {recentJobs.map(job => (
                  <div key={job._id} className="dashboard-list-item">
                    <div className="dashboard-list-item-content">
                      <h4 className="dashboard-list-item-title">{job.title}</h4>
                      <div className="dashboard-list-item-meta">
                        <span className="dashboard-list-item-tag">{job.category}</span>
                        <span className="dashboard-list-item-text">{job.location}</span>
                      </div>
                      <div className="dashboard-list-item-dates">
                        <span className="dashboard-list-item-date">Posted: {formatDate(job.postDate)}</span>
                        <span className="dashboard-list-item-date">Due: {formatDate(job.dueDate)}</span>
                      </div>
                    </div>
                    <div className="job-applications-count">
                      <div className="job-applications-badge">
                        {job.applicationsCount}
                      </div>
                      <p className="job-applications-label">Applications</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="dashboard-section-empty">
                <FileText size={40} className="dashboard-section-empty-icon" />
                <p className="dashboard-section-empty-text">No active job postings</p>
                <Link 
                  to="/post-job" 
                  className="dashboard-primary-button"
                >
                  Post a Job
                </Link>
              </div>
            )}
          </div>
        </div>
        
        <div className="dashboard-section">
          <div className="dashboard-section-header">
            <h3 className="dashboard-section-title">Recent Applications</h3>
            <Link to="/applications-review" className="dashboard-section-link">
              View All
            </Link>
          </div>
          
          <div className="dashboard-section-content">
            {recentApplications.length > 0 ? (
              <div className="dashboard-list">
                {recentApplications.map(application => (
                  <div key={application._id} className="dashboard-list-item">
                    <div className="dashboard-list-item-content">
                      <h4 className="dashboard-list-item-title">{application.applicantName}</h4>
                      <p className="dashboard-list-item-subtitle">{application.jobTitle}</p>
                      <div className="dashboard-list-item-meta">
                        <span className="dashboard-list-item-date">Applied: {formatDate(application.applicationDate)}</span>
                        {application.screening && (
                          <span className={`screening-score ${
                            application.screening.passed ? 'screening-score-pass' : 'screening-score-fail'
                          }`}>
                            Score: {application.screening.score}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="application-status-container">
                      <span className={`application-status application-status-${application.status.toLowerCase()}`}>
                        {application.status}
                      </span>
                      <Link 
                        to={`/applications-review/${application._id}`}
                        className="dashboard-list-item-action"
                      >
                        Review
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="dashboard-section-empty">
                <Users size={40} className="dashboard-section-empty-icon" />
                <p className="dashboard-section-empty-text">No applications to review</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="dashboard-section">
        <div className="dashboard-section-header">
          <h3 className="dashboard-section-title">Application Statistics</h3>
          <Link to="/reports" className="dashboard-section-link">
            View Detailed Reports
          </Link>
        </div>
        
        <div className="chart-container">
          <div className="chart-placeholder">
            <BarChart2 size={48} className="chart-placeholder-icon" />
            <p className="chart-placeholder-text">Charts and statistics would be displayed here</p>
            <p className="chart-placeholder-subtext">Monthly application trends and qualification rates</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRDashboard;