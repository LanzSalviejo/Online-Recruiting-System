import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  User, 
  Briefcase, 
  Mail, 
  Phone, 
  FileText, 
  ArrowLeft, 
  Download,
  Calendar,
  MapPin,
  AlertTriangle 
} from 'lucide-react';
import api from '../../services/api';
import ApplicationReview from '../../components/hr/ApplicationReview';
import ScreeningResults from '../../components/hr/ScreeningResults';

const ApplicationReviewDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showScreening, setShowScreening] = useState(false);

  useEffect(() => {
    const fetchApplicationDetails = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/applications-review/${id}`);
        setApplication(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching application details:', err);
        setError('Failed to load application details. Please try again later.');
        setLoading(false);
      }
    };

    fetchApplicationDetails();
  }, [id]);

  // Handle application status change
  const handleStatusChange = async (applicationId, newStatus) => {
    try {
      await api.put(`/applications/${applicationId}/status`, { status: newStatus });
      
      // Update local state
      setApplication(prevApplication => ({
        ...prevApplication,
        status: newStatus
      }));
      
      return true;
    } catch (error) {
      console.error('Error updating application status:', error);
      return false;
    }
  };

  const toggleScreeningResults = () => {
    setShowScreening(!showScreening);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading application details...</p>
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
        <Link to="/applications-review" className="back-button">
          <ArrowLeft size={16} />
          Back to Applications
        </Link>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="page-container">
        <div className="error-message">
          <AlertTriangle size={24} />
          <p>Application not found.</p>
        </div>
        <Link to="/applications-review" className="back-button">
          <ArrowLeft size={16} />
          Back to Applications
        </Link>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <Link to="/applications-review" className="back-link">
          <ArrowLeft size={16} />
          Back to Applications
        </Link>
        <h1 className="page-title">Application Review</h1>
      </div>

      <ApplicationReview 
        application={application}
        onStatusChange={handleStatusChange}
        onClose={() => navigate('/applications-review')}
      />

      {/* Additional Application Information */}
      <div className="application-review-extra">
        <div className="application-review-section">
          <h2 className="application-review-section-title">
            <Briefcase size={20} className="application-review-section-icon" />
            Job Details
          </h2>
          <div className="job-details-grid">
            <div className="job-details-item">
              <div className="job-details-label">Position</div>
              <div className="job-details-value">{application.jobTitle}</div>
            </div>
            <div className="job-details-item">
              <div className="job-details-label">Company</div>
              <div className="job-details-value">{application.companyName}</div>
            </div>
            <div className="job-details-item">
              <div className="job-details-label">Location</div>
              <div className="job-details-value">
                <MapPin size={16} className="job-details-icon" />
                {application.location}
              </div>
            </div>
            <div className="job-details-item">
              <div className="job-details-label">Posted Date</div>
              <div className="job-details-value">
                <Calendar size={16} className="job-details-icon" />
                {application.postDate && new Date(application.postDate).toLocaleDateString()}
              </div>
            </div>
          </div>
          <Link to={`/jobs/${application.jobId}`} className="view-job-button">
            View Full Job Posting
          </Link>
        </div>

        <div className="application-review-section">
          <h2 className="application-review-section-title">
            <User size={20} className="application-review-section-icon" />
            Applicant Information
          </h2>
          <div className="applicant-details-grid">
            <div className="applicant-details-item">
              <div className="applicant-details-label">Full Name</div>
              <div className="applicant-details-value">{application.applicantName}</div>
            </div>
            <div className="applicant-details-item">
              <div className="applicant-details-label">Email</div>
              <div className="applicant-details-value">
                <Mail size={16} className="applicant-details-icon" />
                <a href={`mailto:${application.applicantEmail}`} className="applicant-email-link">
                  {application.applicantEmail}
                </a>
              </div>
            </div>
            {application.applicantPhone && (
              <div className="applicant-details-item">
                <div className="applicant-details-label">Phone</div>
                <div className="applicant-details-value">
                  <Phone size={16} className="applicant-details-icon" />
                  <a href={`tel:${application.applicantPhone}`} className="applicant-phone-link">
                    {application.applicantPhone}
                  </a>
                </div>
              </div>
            )}
            <div className="applicant-details-item">
              <div className="applicant-details-label">Application Date</div>
              <div className="applicant-details-value">
                <Calendar size={16} className="applicant-details-icon" />
                {new Date(application.applicationDate).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* Applicant History Section */}
        {application.applicantHistory && application.applicantHistory.length > 0 && (
          <div className="application-review-section">
            <h2 className="application-review-section-title">
              <FileText size={20} className="application-review-section-icon" />
              Application History
            </h2>
            <div className="applicant-history-list">
              {application.applicantHistory.map((item, index) => (
                <div key={index} className="applicant-history-item">
                  <div className="applicant-history-job">{item.jobTitle}</div>
                  <div className="applicant-history-details">
                    <div className="applicant-history-date">
                      Applied on {new Date(item.applicationDate).toLocaleDateString()}
                    </div>
                    <div className={`applicant-history-status applicant-history-status-${item.status.toLowerCase().replace(/\s+/g, '-')}`}>
                      {item.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Button to run screening if not already done */}
        <div className="application-review-actions">
          <button
            className="run-screening-button"
            onClick={toggleScreeningResults}
          >
            {application.screening ? 'View Screening Results' : 'Run Screening Analysis'}
          </button>
        </div>

        {/* Conditional Screening Results Display */}
        {showScreening && (
          <ScreeningResults 
            applicationId={application._id} 
            onClose={toggleScreeningResults}
          />
        )}
      </div>
    </div>
  );
};

export default ApplicationReviewDetails;