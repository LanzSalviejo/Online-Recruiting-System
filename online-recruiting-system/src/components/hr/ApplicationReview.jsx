import React, { useState } from 'react';
import { 
  User, 
  Briefcase, 
  Mail, 
  Phone, 
  FileText, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Zap
} from 'lucide-react';
import ScreeningResults from './ScreeningResults';

const ApplicationReview = ({ application, onStatusChange, onClose }) => {
  const [showScreening, setShowScreening] = useState(false);
  const [status, setStatus] = useState(application.status);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (newStatus) => {
    setIsUpdating(true);
    try {
      // Call the parent component's status change handler
      await onStatusChange(application._id, newStatus);
      setStatus(newStatus);
    } catch (error) {
      console.error('Error updating status:', error);
      // Handle error display
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleScreeningResults = () => {
    setShowScreening(!showScreening);
  };

  // Format date strings
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get status badge color
  const getStatusBadgeClass = () => {
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

  return (
    <div className="application-review-container">
      <div className="application-review-header">
        <h2 className="application-review-title">Application Review</h2>
        <div className={`status-badge ${getStatusBadgeClass()}`}>
          {status}
        </div>
      </div>
      
      <div className="application-review-content">
        <div className="application-section">
          <h3 className="application-section-title">
            <User className="application-section-icon" />
            Applicant Information
          </h3>
          <div className="applicant-info">
            <div className="applicant-header">
              <div className="applicant-name">{application.applicantName}</div>
              <div className="applicant-contact">
                <Mail className="contact-icon" />
                <a href={`mailto:${application.applicantEmail}`} className="contact-link">
                  {application.applicantEmail}
                </a>
              </div>
              {application.applicantPhone && (
                <div className="applicant-contact">
                  <Phone className="contact-icon" />
                  <a href={`tel:${application.applicantPhone}`} className="contact-link">
                    {application.applicantPhone}
                  </a>
                </div>
              )}
            </div>
            <div className="application-meta">
              <div className="application-meta-item">
                <span className="meta-label">Applied On:</span>
                <span className="meta-value">{formatDate(application.applicationDate)}</span>
              </div>
              <div className="application-meta-item">
                <span className="meta-label">For Position:</span>
                <span className="meta-value">{application.jobTitle}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Screening Results Button */}
        <div className="screening-results-section">
          <button
            className="screening-results-button"
            onClick={toggleScreeningResults}
          >
            <Zap size={18} className="screening-button-icon" />
            {application.passedScreening !== undefined ? (
              <>
                {application.passedScreening ? (
                  <span>View Qualification Results</span>
                ) : (
                  <span>View Disqualification Reasons</span>
                )}
              </>
            ) : (
              <span>Run Applicant Screening</span>
            )}
          </button>
        </div>
        
        {/* Conditional Screening Results Display */}
        {showScreening && (
          <ScreeningResults 
            applicationId={application._id} 
            onClose={toggleScreeningResults}
          />
        )}
        
        {/* Application Documents */}
        <div className="application-section">
          <h3 className="application-section-title">
            <FileText className="application-section-icon" />
            Application Documents
          </h3>
          <div className="application-documents">
            {application.resumePath ? (
              <a 
                href={application.resumePath} 
                target="_blank" 
                rel="noopener noreferrer"
                className="document-link"
              >
                <div className="document-icon">PDF</div>
                <div className="document-info">
                  <div className="document-name">Resume</div>
                  <div className="document-meta">View or download resume</div>
                </div>
              </a>
            ) : (
              <div className="no-documents">No resume uploaded</div>
            )}
            
            {application.coverLetter && (
              <div className="cover-letter">
                <h4 className="cover-letter-title">Cover Letter</h4>
                <div className="cover-letter-content">
                  {application.coverLetter}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Application Status Management */}
        <div className="application-section">
          <h3 className="application-section-title">
            <Briefcase className="application-section-icon" />
            Manage Application Status
          </h3>
          <div className="application-status-actions">
            <p className="status-instruction">Update the application status:</p>
            <div className="status-buttons">
              <button
                className={`status-button status-button-review ${status === 'Under Review' ? 'status-button-active' : ''}`}
                onClick={() => handleStatusChange('Under Review')}
                disabled={isUpdating}
              >
                Under Review
              </button>
              <button
                className={`status-button status-button-interview ${status === 'Interview' ? 'status-button-active' : ''}`}
                onClick={() => handleStatusChange('Interview')}
                disabled={isUpdating}
              >
                Schedule Interview
              </button>
              <button
                className={`status-button status-button-offer ${status === 'Offer' ? 'status-button-active' : ''}`}
                onClick={() => handleStatusChange('Offer')}
                disabled={isUpdating}
              >
                Extend Offer
              </button>
              <button
                className={`status-button status-button-reject ${status === 'Rejected' ? 'status-button-active' : ''}`}
                onClick={() => handleStatusChange('Rejected')}
                disabled={isUpdating}
              >
                Reject
              </button>
            </div>
          </div>
        </div>
        
        {/* Notes or Additional Comments */}
        {application.notes && (
          <div className="application-section">
            <h3 className="application-section-title">
              <AlertTriangle className="application-section-icon" />
              Notes
            </h3>
            <div className="application-notes">
              {application.notes}
            </div>
          </div>
        )}
      </div>
      
      <div className="application-review-footer">
        <button 
          className="application-close-button"
          onClick={onClose}
          disabled={isUpdating}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default ApplicationReview;