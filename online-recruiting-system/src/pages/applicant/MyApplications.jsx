import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Briefcase, 
  FileText, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User,
  Filter,
  Search,
  AlertCircle
} from 'lucide-react';
import api from '../../services/api';

const MyApplications = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'approved', 'rejected'
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    totalApplications: 0,
    pendingApplications: 0,
    interviewInvitations: 0,
    rejectedApplications: 0,
    offers: 0
  });

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        // Fetch all applications for the current user
        const response = await api.get('/applications');
        
        // Update applications state
        setApplications(response.data);
        
        // Calculate stats
        const allApplications = response.data;
        setStats({
          totalApplications: allApplications.length,
          pendingApplications: allApplications.filter(app => 
            ['Pending', 'Under Review', 'Screened Out'].includes(app.status)
          ).length,
          interviewInvitations: allApplications.filter(app => 
            app.status === 'Interview'
          ).length,
          rejectedApplications: allApplications.filter(app => 
            app.status === 'Rejected'
          ).length,
          offers: allApplications.filter(app => 
            ['Offer', 'Accepted'].includes(app.status)
          ).length
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching applications:', err);
        setError('Failed to load your applications. Please try again later.');
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  // Filter applications based on filter state and search term
  const filteredApplications = applications.filter(app => {
    const matchesFilter = 
      filter === 'all' || 
      (filter === 'pending' && ['Pending', 'Under Review', 'Screened Out'].includes(app.status)) ||
      (filter === 'interview' && app.status === 'Interview') ||
      (filter === 'rejected' && app.status === 'Rejected') ||
      (filter === 'offers' && ['Offer', 'Accepted'].includes(app.status));
    
    const matchesSearch = 
      app.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  // Format date strings
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Pending':
        return 'status-badge-pending';
      case 'Screened Out':
        return 'status-badge-rejected';
      case 'Under Review':
        return 'status-badge-review';
      case 'Interview':
        return 'status-badge-interview';
      case 'Offer':
        return 'status-badge-offer';
      case 'Rejected':
        return 'status-badge-rejected';
      case 'Accepted':
        return 'status-badge-accepted';
      default:
        return 'status-badge-pending';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending':
        return <Clock size={16} />;
      case 'Screened Out':
        return <XCircle size={16} />;
      case 'Under Review':
        return <FileText size={16} />;
      case 'Interview':
        return <User size={16} />;
      case 'Offer':
        return <CheckCircle size={16} />;
      case 'Rejected':
        return <XCircle size={16} />;
      case 'Accepted':
        return <CheckCircle size={16} />;
      default:
        return <Clock size={16} />;
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading your applications...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="error-message">
          <AlertCircle size={24} />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1 className="page-title">My Applications</h1>
      
      {/* Stats Cards */}
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
            <User size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-title">Interviews</p>
            <p className="stat-value">{stats.interviewInvitations}</p>
          </div>
        </div>
        
        <div className="stat-card stat-card-purple">
          <div className="stat-icon-container stat-icon-purple">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-title">Offers</p>
            <p className="stat-value">{stats.offers}</p>
          </div>
        </div>
      </div>
      
      {/* Search and Filter Bar */}
      <div className="applications-filter-bar">
        <div className="search-container">
          <div className="search-input-wrapper">
            <Search className="search-icon" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search jobs, companies..."
              className="search-input"
            />
          </div>
        </div>
        
        <div className="filter-tabs">
          <button 
            className={`filter-tab ${filter === 'all' ? 'filter-tab-active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button 
            className={`filter-tab ${filter === 'pending' ? 'filter-tab-active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pending
          </button>
          <button 
            className={`filter-tab ${filter === 'interview' ? 'filter-tab-active' : ''}`}
            onClick={() => setFilter('interview')}
          >
            Interviews
          </button>
          <button 
            className={`filter-tab ${filter === 'offers' ? 'filter-tab-active' : ''}`}
            onClick={() => setFilter('offers')}
          >
            Offers
          </button>
          <button 
            className={`filter-tab ${filter === 'rejected' ? 'filter-tab-active' : ''}`}
            onClick={() => setFilter('rejected')}
          >
            Rejected
          </button>
        </div>
      </div>
      
      {/* Applications List */}
      {filteredApplications.length === 0 ? (
        <div className="no-applications">
          <div className="no-applications-icon">
            <Briefcase size={48} />
          </div>
          <h3 className="no-applications-title">No applications found</h3>
          <p className="no-applications-message">
            {filter !== 'all' 
              ? `You don't have any applications with the "${filter}" status.` 
              : `You haven't applied to any jobs yet.`}
          </p>
          {filter !== 'all' ? (
            <button 
              className="filter-reset-button"
              onClick={() => setFilter('all')}
            >
              View all applications
            </button>
          ) : (
            <Link to="/jobs" className="applications-action-button">
              Browse Jobs
            </Link>
          )}
        </div>
      ) : (
        <div className="applications-list">
          {filteredApplications.map(application => (
            <div key={application._id} className="application-card">
              <div className="application-header">
                <h3 className="application-job-title">
                  <Link to={`/jobs/${application.jobId}`}>
                    {application.jobTitle}
                  </Link>
                </h3>
                <div className={`status-badge ${getStatusBadgeClass(application.status)}`}>
                  {getStatusIcon(application.status)}
                  <span>{application.status}</span>
                </div>
              </div>
              
              <div className="application-company">{application.companyName}</div>
              
              <div className="application-meta">
                <div className="application-meta-item">
                  <Calendar size={16} className="application-meta-icon" />
                  <span>Applied: {formatDate(application.applicationDate)}</span>
                </div>
                <div className="application-meta-item">
                  <Briefcase size={16} className="application-meta-icon" />
                  <span>{application.positionType}</span>
                </div>
                <div className="application-meta-item">
                  <MapPin size={16} className="application-meta-icon" />
                  <span>{application.location}</span>
                </div>
              </div>
              
              {/* Progress Timeline */}
              <div className="application-progress">
                <div className="progress-timeline">
                  <div className={`progress-step ${
                    ['Pending', 'Under Review', 'Screened Out', 'Interview', 'Offer', 'Accepted'].includes(application.status) 
                      ? 'progress-step-complete' 
                      : ''
                  }`}>
                    <div className="progress-marker"></div>
                    <div className="progress-label">Applied</div>
                  </div>
                  <div className="progress-line"></div>
                  <div className={`progress-step ${
                    ['Under Review', 'Interview', 'Offer', 'Accepted'].includes(application.status) 
                      ? 'progress-step-complete' 
                      : ''
                  }`}>
                    <div className="progress-marker"></div>
                    <div className="progress-label">Reviewed</div>
                  </div>
                  <div className="progress-line"></div>
                  <div className={`progress-step ${
                    ['Interview', 'Offer', 'Accepted'].includes(application.status) 
                      ? 'progress-step-complete' 
                      : ''
                  }`}>
                    <div className="progress-marker"></div>
                    <div className="progress-label">Interview</div>
                  </div>
                  <div className="progress-line"></div>
                  <div className={`progress-step ${
                    ['Offer', 'Accepted'].includes(application.status) 
                      ? 'progress-step-complete' 
                      : ''
                  }`}>
                    <div className="progress-marker"></div>
                    <div className="progress-label">Offer</div>
                  </div>
                </div>
              </div>
              
              <div className="application-footer">
                <Link 
                  to={`/applications/${application._id}`}
                  className="application-view-button"
                >
                  View Details
                </Link>
                <Link 
                  to={`/jobs/${application.jobId}`}
                  className="application-job-link"
                >
                  View Job
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyApplications;