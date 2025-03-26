import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Calendar, 
  MapPin, 
  Briefcase, 
  DollarSign, 
  Mail, 
  Award, 
  Clock,
  Share2,
  BookmarkPlus
} from 'lucide-react';

const JobDetail = ({ job, onApply, loading }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showShareOptions, setShowShareOptions] = useState(false);

  // If loading or no job data yet, show loading spinner
  if (loading || !job) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading job details...</p>
      </div>
    );
  }

  // Format date to readable format - includes null checking
  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid Date";
      
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return date.toLocaleDateString(undefined, options);
    } catch (error) {
      console.error("Date formatting error:", error);
      return "Invalid Date";
    }
  };

  const handleApplyClick = () => {
    if (!user) {
      navigate('/login', { state: { from: `/jobs/${job.id || job._id}` } });
      return;
    }
    
    // Pass the correct job ID from the job object
    onApply(job.id || job._id);
  };

  const shareJob = (platform) => {
    const jobUrl = window.location.href;
    const jobTitle = encodeURIComponent(job.title);
    
    let shareUrl;
    
    switch (platform) {
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(jobUrl)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=Check out this job: ${jobTitle}&url=${encodeURIComponent(jobUrl)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(jobUrl)}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=Job Opening: ${jobTitle}&body=I found this job opening that might interest you: ${jobUrl}`;
        break;
      default:
        return;
    }
    
    window.open(shareUrl, '_blank');
    setShowShareOptions(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    setShowShareOptions(false);
    // You can add a toast notification here
  };

  // Normalize variable names to handle both snake_case and camelCase
  const {
    id = job._id,
    title,
    description,
    company_name,
    companyName,
    location,
    position_type,
    positionType,
    salary,
    post_date,
    postDate,
    due_date,
    dueDate,
    category_name,
    categoryName,
    min_education_level,
    minEducationLevel,
    min_experience,
    minExperience,
    contact_email,
    contactEmail,
    responsibilities,
    requirements
  } = job;

  // Use normalized variables
  const normalizedCompanyName = company_name || companyName || "Unknown Company";
  const normalizedPositionType = position_type || positionType || "Not specified";
  const normalizedPostDate = post_date || postDate;
  const normalizedDueDate = due_date || dueDate;
  const normalizedCategoryName = category_name || categoryName || "Uncategorized";
  const normalizedEducation = min_education_level || minEducationLevel || "Not specified";
  const normalizedExperience = min_experience || minExperience || 0;
  const normalizedContactEmail = contact_email || contactEmail || "Not provided";

  // Parse JSON strings for responsibilities and requirements if needed
  const parseJsonIfNeeded = (value) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch (e) {
        return value;
      }
    }
    return value;
  };

  const parsedResponsibilities = parseJsonIfNeeded(responsibilities);
  const parsedRequirements = parseJsonIfNeeded(requirements);

  // Check if responsibilities is an array
  const responsibilitiesArray = Array.isArray(parsedResponsibilities) 
    ? parsedResponsibilities 
    : parsedResponsibilities 
      ? [parsedResponsibilities] 
      : [];

  // Check if requirements is an array
  const requirementsArray = Array.isArray(parsedRequirements)
    ? parsedRequirements
    : parsedRequirements
      ? [parsedRequirements]
      : [];

  return (
    <div className="job-detail-container">
      <div className="job-detail-content">
        <div className="job-detail-header">
          <div className="job-detail-title-section">
            <h1 className="job-detail-title">{title}</h1>
            <p className="job-company">{normalizedCompanyName}</p>
            <div className="job-meta">
              <div className="job-meta-item">
                <Briefcase className="job-meta-icon" />
                <span>{normalizedCategoryName}</span>
              </div>
              <div className="job-meta-item">
                <MapPin className="job-meta-icon" />
                <span>{location}</span>
              </div>
              {salary && (
                <div className="job-meta-item">
                  <DollarSign className="job-meta-icon" />
                  <span>${typeof salary === 'number' ? salary.toLocaleString() : salary} per year</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="job-tag-container">
            <span className={`job-tag ${
              normalizedPositionType === 'Full Time' 
                ? 'job-tag-fulltime' 
                : normalizedPositionType === 'Part Time'
                  ? 'job-tag-parttime'
                  : 'job-tag-contract'
            }`}>
              {normalizedPositionType}
            </span>
          </div>
        </div>
        
        <div className="job-detail-metadata">
          <div className="job-metadata-items">
            <div className="job-metadata-item">
              <Calendar className="job-metadata-icon job-metadata-icon-blue" />
              <div className="job-metadata-content">
                <p className="job-metadata-label">Posted</p>
                <p className="job-metadata-value">{formatDate(normalizedPostDate)}</p>
              </div>
            </div>
            <div className="job-metadata-item">
              <Calendar className="job-metadata-icon job-metadata-icon-red" />
              <div className="job-metadata-content">
                <p className="job-metadata-label">Apply Before</p>
                <p className="job-metadata-value">{formatDate(normalizedDueDate)}</p>
              </div>
            </div>
            <div className="job-metadata-item">
              <Award className="job-metadata-icon job-metadata-icon-yellow" />
              <div className="job-metadata-content">
                <p className="job-metadata-label">Education</p>
                <p className="job-metadata-value">{normalizedEducation}</p>
              </div>
            </div>
            <div className="job-metadata-item">
              <Clock className="job-metadata-icon job-metadata-icon-green" />
              <div className="job-metadata-content">
                <p className="job-metadata-label">Experience</p>
                <p className="job-metadata-value">
                  {normalizedExperience} {parseInt(normalizedExperience) === 1 ? 'year' : 'years'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="job-actions">
            <div className="job-share-container">
              <button
                onClick={() => setShowShareOptions(!showShareOptions)}
                className="job-action-button job-share-button"
                aria-label="Share job"
              >
                <Share2 size={18} />
              </button>
              
              {showShareOptions && (
                <div className="job-share-options">
                  <button
                    onClick={() => shareJob('linkedin')}
                    className="job-share-option"
                  >
                    Share on LinkedIn
                  </button>
                  <button
                    onClick={() => shareJob('twitter')}
                    className="job-share-option"
                  >
                    Share on Twitter
                  </button>
                  <button
                    onClick={() => shareJob('facebook')}
                    className="job-share-option"
                  >
                    Share on Facebook
                  </button>
                  <button
                    onClick={() => shareJob('email')}
                    className="job-share-option"
                  >
                    Share via Email
                  </button>
                  <button
                    onClick={copyToClipboard}
                    className="job-share-option"
                  >
                    Copy Link
                  </button>
                </div>
              )}
            </div>
            
            <button
              className="job-action-button job-bookmark-button"
              aria-label="Bookmark job"
            >
              <BookmarkPlus size={18} />
            </button>
          </div>
        </div>
        
        <div className="job-detail-section">
          <h2 className="job-detail-section-title">Job Description</h2>
          <div className="job-detail-description">
            {description}
          </div>
        </div>
        
        {responsibilitiesArray.length > 0 && (
          <div className="job-detail-section">
            <h2 className="job-detail-section-title">Responsibilities</h2>
            <ul className="job-detail-list">
              {responsibilitiesArray.map((responsibility, index) => (
                <li key={index} className="job-detail-list-item">{responsibility}</li>
              ))}
            </ul>
          </div>
        )}
        
        {requirementsArray.length > 0 && (
          <div className="job-detail-section">
            <h2 className="job-detail-section-title">Requirements</h2>
            <ul className="job-detail-list">
              {requirementsArray.map((requirement, index) => (
                <li key={index} className="job-detail-list-item">{requirement}</li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="job-detail-section">
          <h2 className="job-detail-section-title">Contact Information</h2>
          <div className="job-detail-contact">
            <Mail className="job-contact-icon" />
            <span className="job-contact-value">{normalizedContactEmail}</span>
          </div>
        </div>
        
        <div className="job-detail-actions">
          <button
            onClick={handleApplyClick}
            disabled={loading}
            className="job-apply-button"
          >
            {loading ? 'Submitting...' : 'Apply Now'}
          </button>
          
          <Link
            to="/jobs"
            className="job-back-button"
          >
            Back to Jobs
          </Link>
        </div>
      </div>
    </div>
  );
};

export default JobDetail;