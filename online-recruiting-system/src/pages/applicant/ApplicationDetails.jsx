import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Briefcase, 
  Calendar, 
  MapPin, 
  FileText, 
  ArrowLeft, 
  Clock, 
  CheckCircle, 
  XCircle, 
  User,
  AlertTriangle,
  Download,
  Building
} from 'lucide-react';
import api from '../../services/api';

const ApplicationDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchApplicationDetails = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/applications/${id}`);
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

  // Format date strings
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
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
        return <Clock size={20} />;
      case 'Screened Out':
        return <XCircle size={20} />;
      case 'Under Review':
        return <FileText size={20} />;
      case 'Interview':
        return <User size={20} />;
      case 'Offer':
        return <CheckCircle size={20} />;
      case 'Rejected':
        return <XCircle size={20} />;
      case 'Accepted':
        return <CheckCircle size={20} />;
      default:
        return <Clock size={20} />;
    }
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
        <Link to="/applications" className="back-button">
          <ArrowLeft size={16} />
          Back to Applications
        </Link>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <Link to="/applications" className="back-link">
          <ArrowLeft size={16} />
          Back to Applications
        </Link>
        <h1 className="page-title">Application Details</h1>
      </div>

      <div className="application-details-container">
        <div className="application-details-header">
          <div className="application-details-job">
            <h2 className="application-details-job-title">
              <Link to={`/jobs/${application.jobId}`}>{application.jobTitle}</Link>
            </h2>
            <div className="application-details-company">
              <Building size={16} className="application-details-icon" />
              {application.companyName}
            </div>
            <div className="application-details-meta">
              <div className="application-details-meta-item">
                <MapPin size={16} className="application-details-icon" />
                {application.location}
              </div>
              <div className="application-details-meta-item">
                <Briefcase size={16} className="application-details-icon" />
                {application.positionType}
              </div>
              <div className="application-details-meta-item">
                <Calendar size={16} className="application-details-icon" />
                Applied: {formatDate(application.applicationDate)}
              </div>
            </div>
          </div>

          <div className={`application-details-status ${getStatusBadgeClass(application.status)}`}>
            {getStatusIcon(application.status)}
            <span>{application.status}</span>
          </div>
        </div>

        {/* Application Timeline */}
        <div className="application-timeline">
          <h3 className="section-title">Application Status</h3>

          <div className="timeline">
            <div className="timeline-item timeline-item-complete">
              <div className="timeline-marker"></div>
              <div className="timeline-content">
                <h4 className="timeline-title">Application Submitted</h4>
                <p className="timeline-date">{formatDate(application.applicationDate)}</p>
                <p className="timeline-description">
                  Your application has been successfully submitted.
                </p>
              </div>
            </div>

            <div className={`timeline-item ${
              ['Under Review', 'Interview', 'Offer', 'Accepted', 'Rejected', 'Screened Out'].includes(application.status) 
                ? 'timeline-item-complete' 
                : ''
            }`}>
              <div className="timeline-marker"></div>
              <div className="timeline-content">
                <h4 className="timeline-title">Application Review</h4>
                <p className="timeline-date">
                  {application.screenedAt ? formatDate(application.screenedAt) : 'Pending'}
                </p>
                <p className="timeline-description">
                  {application.status === 'Screened Out' 
                    ? 'Your application did not meet the minimum requirements for this position.'
                    : application.status === 'Under Review'
                    ? 'Your application has passed initial screening and is being reviewed by the hiring team.'
                    : ['Interview', 'Offer', 'Accepted', 'Rejected'].includes(application.status)
                    ? 'Your application has been reviewed by the hiring team.'
                    : 'Your application is waiting to be reviewed.'}
                </p>
                {application.screening && (
                  <div className="screening-result">
                    <div className="screening-score">
                      Score: <span className={
                        application.screening.score >= 75 ? 'score-passing' : 'score-failing'
                      }>{application.screening.score}/100</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className={`timeline-item ${
              ['Interview', 'Offer', 'Accepted', 'Rejected'].includes(application.status) 
                ? 'timeline-item-complete' 
                : ''
            }`}>
              <div className="timeline-marker"></div>
              <div className="timeline-content">
                <h4 className="timeline-title">Interview</h4>
                <p className="timeline-date">
                  {application.interviewDate ? formatDate(application.interviewDate) : 
                   application.status === 'Interview' ? 'Scheduled' : 
                   ['Offer', 'Accepted', 'Rejected'].includes(application.status) ? 'Completed' : 'Pending'}
                </p>
                <p className="timeline-description">
                  {application.status === 'Interview'
                    ? 'You have been selected for an interview. Check your email for details.'
                    : ['Offer', 'Accepted', 'Rejected'].includes(application.status)
                    ? 'Your interview has been completed.'
                    : 'Waiting for interview decision.'}
                </p>
              </div>
            </div>

            <div className={`timeline-item ${
              ['Offer', 'Accepted', 'Rejected'].includes(application.status) 
                ? 'timeline-item-complete' 
                : ''
            }`}>
              <div className="timeline-marker"></div>
              <div className="timeline-content">
                <h4 className="timeline-title">Decision</h4>
                <p className="timeline-date">
                  {application.decisionDate ? formatDate(application.decisionDate) : 'Pending'}
                </p>
                <p className="timeline-description">
                  {application.status === 'Offer'
                    ? 'Congratulations! You have received a job offer. Check your email for details.'
                    : application.status === 'Accepted'
                    ? 'You have accepted the job offer. Congratulations!'
                    : application.status === 'Rejected'
                    ? 'Unfortunately, your application was not selected for this position.'
                    : 'Waiting for final decision.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Application Documents */}
        <div className="application-documents">
          <h3 className="section-title">Your Application Materials</h3>
          
          {application.resumePath ? (
            <div className="document-card">
              <div className="document-icon">
                <FileText size={24} />
              </div>
              <div className="document-info">
                <h4 className="document-title">Resume</h4>
                <p className="document-description">Uploaded: {formatDate(application.applicationDate)}</p>
              </div>
              <a href={application.resumePath} download className="document-download">
                <Download size={16} />
                Download
              </a>
            </div>
          ) : (
            <div className="document-placeholder">
              <p>No resume was uploaded with this application.</p>
            </div>
          )}

          {application.coverLetter ? (
            <div className="cover-letter-section">
              <h4 className="cover-letter-title">Cover Letter</h4>
              <div className="cover-letter-content">
                {application.coverLetter}
              </div>
            </div>
          ) : (
            <div className="document-placeholder">
              <p>No cover letter was included with this application.</p>
            </div>
          )}
        </div>

        {/* Notes or Feedback */}
        {application.notes && (
          <div className="application-notes">
            <h3 className="section-title">Feedback</h3>
            <div className="notes-content">
              {application.notes}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="application-details-actions">
          {application.status === 'Offer' && (
            <>
              <button className="accept-offer-button">
                <CheckCircle size={16} />
                Accept Offer
              </button>
              <button className="decline-offer-button">
                <XCircle size={16} />
                Decline Offer
              </button>
            </>
          )}
          <Link to={`/jobs/${application.jobId}`} className="view-job-button">
            <Briefcase size={16} />
            View Job Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetails;