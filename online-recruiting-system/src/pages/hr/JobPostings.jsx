import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Briefcase, 
  Calendar, 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  ChevronDown, 
  Search,
  Users,
  AlertTriangle,
  User,
  CheckCircle
} from 'lucide-react';
import api from '../../services/api';

const JobPostings = () => {
  const { user } = useAuth();
  const [jobPostings, setJobPostings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('active'); // 'active', 'all', 'expired'
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'alphabetical', 'applications'
  const [showSortOptions, setShowSortOptions] = useState(false);
  const isAdmin = user?.accountType === 'admin';
  
  // New state for delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    const fetchJobPostings = async () => {
      try {
        setLoading(true);
        
        // Different endpoint for admin vs HR
        const endpoint = isAdmin 
          ? '/admin/jobs' // Admin endpoint for all jobs
          : '/hr/job-postings'; // HR sees only their jobs
          
        const response = await api.get(endpoint);
        
        // For admin endpoint, extract jobs from the response structure
        const jobs = isAdmin && response.data.jobs 
          ? response.data.jobs 
          : response.data;
          
        setJobPostings(jobs);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching job postings:', err);
        setError('Failed to load job postings. Please try again later.');
        setLoading(false);
      }
    };

    fetchJobPostings();
  }, [isAdmin]);

  // Filter job postings based on filter state
  const getFilteredJobs = () => {
    const currentDate = new Date();
    
    // First apply status filter
    let filtered = jobPostings.filter(job => {
      const dueDate = new Date(job.dueDate);
      
      if (filter === 'active') {
        return job.isActive && dueDate >= currentDate;
      } else if (filter === 'expired') {
        return !job.isActive || dueDate < currentDate;
      } else {
        return true; // 'all' filter
      }
    });

    // Then apply search filter if there's a search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(job => 
        job.title.toLowerCase().includes(term) ||
        job.companyName.toLowerCase().includes(term) ||
        job.location.toLowerCase().includes(term) ||
        (job.categoryName && job.categoryName.toLowerCase().includes(term)) ||
        (isAdmin && job.creatorName && job.creatorName.toLowerCase().includes(term))
      );
    }

    // Then apply sorting
    if (sortBy === 'newest') {
      return filtered.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));
    } else if (sortBy === 'alphabetical') {
      return filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'applications') {
      return filtered.sort((a, b) => (b.applicationsCount || 0) - (a.applicationsCount || 0));
    }
    
    return filtered;
  };

  // Updated delete job function
  const handleDeleteJob = (job) => {
    setJobToDelete(job);
    setShowDeleteModal(true);
  };

  // Confirm delete function
  const confirmDelete = async () => {
    if (!jobToDelete) return;
    
    try {
      setIsDeleting(true);
      
      // Different endpoint depending on user type
      const endpoint = isAdmin
        ? `/admin/jobs/${jobToDelete._id}`  // Admin endpoint
        : `/jobs/${jobToDelete._id}`;       // Regular endpoint
        
      await api.delete(endpoint);
      
      // Update local state to remove the deleted job
      setJobPostings(prevJobs => prevJobs.filter(job => job._id !== jobToDelete._id));
      
      // Show success message
      setSuccessMessage("Job posting deleted successfully");
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Reset modal state
      setShowDeleteModal(false);
      setJobToDelete(null);
      setIsDeleting(false);
    } catch (err) {
      console.error('Error deleting job posting:', err);
      setDeleteError("Failed to delete job posting. Please try again.");
      setIsDeleting(false);
    }
  };

  // Format date strings
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Check if a job is expired
  const isJobExpired = (dueDate) => {
    return new Date(dueDate) < new Date();
  };

  // Calculate days remaining
  const getDaysRemaining = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    
    // Set both dates to midnight for accurate day calculation
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  // Get status badge for job
  const getJobStatusBadge = (job) => {
    if (!job.isActive) {
      return <span className="job-status job-status-inactive">Inactive</span>;
    } else if (isJobExpired(job.dueDate)) {
      return <span className="job-status job-status-expired">Expired</span>;
    } else {
      const daysRemaining = getDaysRemaining(job.dueDate);
      if (daysRemaining <= 3) {
        return <span className="job-status job-status-closing-soon">Closing Soon</span>;
      } else {
        return <span className="job-status job-status-active">Active</span>;
      }
    }
  };

  // For admin users, render the creator info
  const renderCreatorInfo = (job) => {
    if (isAdmin && job.creatorName) {
      return (
        <div className="job-posting-meta-item job-creator-info">
          <User size={16} className="job-posting-meta-icon" />
          <span>{job.creatorName}</span>
        </div>
      );
    }
    return null;
  };

  // Check if user can edit/delete this job
  const canModifyJob = (job) => {
    // Admins can modify any job
    if (isAdmin) return true;
    
    // HR users can only modify their own jobs
    return job.creatorId === user.id;
  };

  const filteredJobs = getFilteredJobs();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading job postings...</p>
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
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header-with-actions">
        <h1 className="page-title">
          {isAdmin ? 'All Job Postings' : 'Manage Job Postings'}
        </h1>
        {/* Only show Post New Job button for HR users */}
        {!isAdmin && (
          <Link 
            to="/post-job" 
            className="primary-button"
          >
            <Plus size={16} />
            Post New Job
          </Link>
        )}
      </div>
      
      {/* Filter and Search */}
      <div className="filter-search-container">
        <div className="filter-tabs">
          <button 
            className={`filter-tab ${filter === 'active' ? 'filter-tab-active' : ''}`}
            onClick={() => setFilter('active')}
          >
            Active
          </button>
          <button 
            className={`filter-tab ${filter === 'all' ? 'filter-tab-active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button 
            className={`filter-tab ${filter === 'expired' ? 'filter-tab-active' : ''}`}
            onClick={() => setFilter('expired')}
          >
            Expired
          </button>
        </div>
        
        <div className="search-sort">
          <div className="search-container">
            <div className="search-input-wrapper">
              <Search className="search-icon" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={isAdmin ? "Search job title, company, creator..." : "Search job title, company..."}
                className="search-input"
              />
            </div>
          </div>
          
          <div className="sort-dropdown">
            <button
              className="sort-button"
              onClick={() => setShowSortOptions(!showSortOptions)}
            >
              <span>Sort by: {sortBy === 'newest' ? 'Newest' : sortBy === 'alphabetical' ? 'Alphabetical' : 'Applications'}</span>
              <ChevronDown size={16} />
            </button>
            
            {showSortOptions && (
              <div className="sort-options">
                <button
                  className={`sort-option ${sortBy === 'newest' ? 'sort-option-active' : ''}`}
                  onClick={() => {
                    setSortBy('newest');
                    setShowSortOptions(false);
                  }}
                >
                  Newest
                </button>
                <button
                  className={`sort-option ${sortBy === 'alphabetical' ? 'sort-option-active' : ''}`}
                  onClick={() => {
                    setSortBy('alphabetical');
                    setShowSortOptions(false);
                  }}
                >
                  Alphabetical
                </button>
                <button
                  className={`sort-option ${sortBy === 'applications' ? 'sort-option-active' : ''}`}
                  onClick={() => {
                    setSortBy('applications');
                    setShowSortOptions(false);
                  }}
                >
                  Most Applications
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Job Postings List */}
      {filteredJobs.length === 0 ? (
        <div className="no-jobs">
          <div className="no-jobs-icon">
            <Briefcase size={48} />
          </div>
          <h3 className="no-jobs-title">No job postings found</h3>
          <p className="no-jobs-message">
            {filter !== 'all' 
              ? `No ${filter === 'active' ? 'active' : 'expired'} job postings found.` 
              : searchTerm
                ? `No job postings match your search.`
                : isAdmin 
                  ? `There are no job postings in the system yet.`
                  : `You haven't created any job postings yet.`}
          </p>
          {filter !== 'all' ? (
            <button 
              className="filter-reset-button"
              onClick={() => setFilter('all')}
            >
              View all job postings
            </button>
          ) : (!isAdmin && (
            <Link to="/post-job" className="primary-button">
              <Plus size={16} />
              Post New Job
            </Link>
          ))}
        </div>
      ) : (
        <div className="job-postings-list">
          {filteredJobs.map(job => (
            <div key={job._id} className="job-posting-card">
              <div className="job-posting-content">
                <div className="job-posting-header">
                  <h3 className="job-posting-title">
                    <Link to={`/jobs/${job._id}`}>{job.title}</Link>
                  </h3>
                  {getJobStatusBadge(job)}
                </div>
                
                <div className="job-posting-company">{job.companyName}</div>
                
                <div className="job-posting-meta">
                  <div className="job-posting-meta-item">
                    <MapPin size={16} className="job-posting-meta-icon" />
                    {job.location}
                  </div>
                  <div className="job-posting-meta-item">
                    <Briefcase size={16} className="job-posting-meta-icon" />
                    {job.positionType}
                  </div>
                  <div className="job-posting-meta-item">
                    <Calendar size={16} className="job-posting-meta-icon" />
                    {isJobExpired(job.dueDate) 
                      ? `Expired on ${formatDate(job.dueDate)}` 
                      : `Closes on ${formatDate(job.dueDate)}`}
                  </div>
                  {renderCreatorInfo(job)}
                </div>
                
                <div className="job-posting-dates">
                  <div className="job-posting-date">
                    <span className="job-posting-date-label">Posted:</span>
                    <span className="job-posting-date-value">{formatDate(job.postDate)}</span>
                  </div>
                  
                  {!isJobExpired(job.dueDate) && (
                    <div className="job-posting-days-remaining">
                      <span className="job-posting-days-value">{getDaysRemaining(job.dueDate)}</span>
                      <span className="job-posting-days-label">days remaining</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="job-posting-right">
                <div className="applications-badge">
                <Users size={16} className="applications-badge-icon" />
                  <span className="applications-count">{job.applicationsCount || 0}</span>
                  <span className="applications-label">Applications</span>
                </div>
                
                <div className="job-posting-actions">
                  <Link 
                    to={`/applications-review/${job._id}`} 
                    className="job-posting-action-button job-posting-action-primary"
                    title="Review Applications"
                  >
                    <Users size={16} />
                    <span className="action-label">Review</span>
                  </Link>

                  {/* Edit button - shown for all jobs */}
                  <Link 
                    to={`/edit-job/${job._id}`} 
                    className="job-posting-action-button job-posting-action-edit"
                    title="Edit Job Posting"
                  >
                    <Edit size={16} />
                    <span className="action-label">Edit</span>
                  </Link>
                  
                  {/* Delete button */}
                  <button 
                    onClick={() => handleDeleteJob(job)} 
                    className="job-posting-action-button job-posting-action-delete"
                    title="Delete Job Posting"
                  >
                    <Trash2 size={16} />
                    <span className="action-label">Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && jobToDelete && (
        <div className="delete-modal-overlay">
          <div className="delete-modal">
            <div className="delete-modal-header">
              <AlertTriangle size={24} className="delete-modal-icon" />
              <h3 className="delete-modal-title">Delete Job Posting</h3>
            </div>
            
            <div className="delete-modal-content">
              <p>Are you sure you want to delete the following job posting?</p>
              <div className="delete-job-details">
                <strong>{jobToDelete.title}</strong>
                <span>{jobToDelete.companyName || jobToDelete.company_name}</span>
              </div>
              <p className="delete-warning">This action cannot be undone.</p>
              
              {deleteError && (
                <div className="delete-error-message">
                  <AlertTriangle size={16} />
                  <span>{deleteError}</span>
                </div>
              )}
            </div>
            
            <div className="delete-modal-actions">
              <button 
                className="delete-modal-cancel" 
                onClick={() => {
                  setShowDeleteModal(false);
                  setJobToDelete(null);
                  setDeleteError(null);
                }}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                className="delete-modal-confirm" 
                onClick={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Job'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="success-message">
          <CheckCircle size={16} />
          <span>{successMessage}</span>
        </div>
      )}
    </div>
  );
};

export default JobPostings;