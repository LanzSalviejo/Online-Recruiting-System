import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Briefcase, DollarSign } from 'lucide-react';

const JobCard = ({ job }) => {
  // Format date to readable format
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Determine job tag class based on position type
  const getJobTagClass = () => {
    switch (job.positionType) {
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
            <Link to={`/jobs/${job.id || job._id}`} className="job-title-link">
              {job.title}
            </Link>
          </h3>
          <span className={`job-tag ${getJobTagClass()}`}>
            {job.positionType}
          </span>
        </div>
        
        <div className="job-meta">
          <div className="job-meta-item">
            <Briefcase size={16} className="job-meta-icon" />
            <span>{job.categoryName}</span>
          </div>
          <div className="job-meta-item">
            <MapPin size={16} className="job-meta-icon" />
            <span>{job.location}</span>
          </div>
          {job.salary && (
            <div className="job-meta-item">
              <DollarSign size={16} className="job-meta-icon" />
              <span>${job.salary.toLocaleString()}</span>
            </div>
          )}
          <div className="job-meta-item">
            <Calendar size={16} className="job-meta-icon" />
            <span>Due: {formatDate(job.dueDate)}</span>
          </div>
        </div>
        
        <p className="job-description">{job.description}</p>
        
        <div className="job-card-footer">
          <span className="job-post-date">
            Posted: {formatDate(job.postDate)}
          </span>
          <Link to={`/jobs/${job.id || job._id}`} className="job-view-button">
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default JobCard;