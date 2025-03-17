import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Briefcase, DollarSign } from 'lucide-react';

const JobCard = ({ job }) => {
  // Handle potential naming inconsistencies in the props
  const {
    id = job._id,
    title,
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
    description
  } = job;

  const normalizedCompanyName = company_name || companyName || "Unknown Company";
  const normalizedPositionType = position_type || positionType || "Not specified";
  const normalizedPostDate = post_date || postDate;
  const normalizedDueDate = due_date || dueDate;
  const normalizedCategoryName = category_name || categoryName || "Uncategorized";

  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";
      return date.toLocaleDateString("en-US", {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error("Date formatting error:", error);
      return "N/A";
    }
  };

  // Determine job tag class based on position type
  const getJobTagClass = () => {
    switch (normalizedPositionType) {
      case 'Full Time':
        return 'job-tag-fulltime';
      case 'Part Time':
        return 'job-tag-parttime';
      case 'Contract':
        return 'job-tag-contract';
      default:
        return 'job-tag-other';
    }
  };

  return (
    <div className="job-card">
      <div className="job-card-content">
        <div className="job-card-header">
          <h3 className="job-title">
            <Link to={`/jobs/${id}`} className="job-title-link">
              {title}
            </Link>
          </h3>
          <span className={`job-tag ${getJobTagClass()}`}>
            {normalizedPositionType}
          </span>
        </div>
        
        <p className="job-company">{normalizedCompanyName}</p>
        
        <div className="job-meta">
          <div className="job-meta-item">
            <MapPin size={16} className="job-meta-icon" />
            <span>{location}</span>
          </div>
          
          <div className="job-meta-item">
            <Briefcase size={16} className="job-meta-icon" />
            <span>{normalizedCategoryName}</span>
          </div>
          
          {salary && (
            <div className="job-meta-item">
              <DollarSign size={16} className="job-meta-icon" />
              <span>${typeof salary === 'number' ? salary.toLocaleString() : salary}</span>
            </div>
          )}
          
          <div className="job-meta-item">
            <Clock size={16} className="job-meta-icon" />
            <span>Due: {formatDate(normalizedDueDate)}</span>
          </div>
        </div>
        
        {description && (
          <p className="job-description">{description.length > 150 
            ? `${description.substring(0, 150)}...` 
            : description}
          </p>
        )}
        
        <div className="job-card-footer">
          <span className="job-post-date">
            Posted: {formatDate(normalizedPostDate)}
          </span>
          <Link to={`/jobs/${id}`} className="job-view-button">
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default JobCard;