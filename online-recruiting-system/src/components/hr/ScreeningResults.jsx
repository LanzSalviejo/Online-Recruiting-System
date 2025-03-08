import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, BookOpen, Clock, Award } from 'lucide-react';
import api from '../../services/api';

const ScreeningResults = ({ applicationId, onClose }) => {
  const [screeningData, setScreeningData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchScreeningResults = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/screening/application/${applicationId}`);
        setScreeningData(response.data.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching screening results:', err);
        setError(err.response?.data?.message || 'Failed to load screening results');
        setLoading(false);
      }
    };

    if (applicationId) {
      fetchScreeningResults();
    }
  }, [applicationId]);

  const handleManualScreen = async () => {
    try {
      setLoading(true);
      const response = await api.post(`/screening/application/${applicationId}`);
      setScreeningData(response.data.data);
      setLoading(false);
    } catch (err) {
      console.error('Error performing manual screening:', err);
      setError(err.response?.data?.message || 'Failed to perform screening');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="screening-results-loading">
        <div className="loading-spinner"></div>
        <p>Loading screening results...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="screening-results-error">
        <AlertCircle size={24} />
        <p>{error}</p>
        <button className="screening-retry-button" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  // If no screening data exists yet, show option to run screening
  if (!screeningData || !screeningData.score) {
    return (
      <div className="screening-results-container screening-not-run">
        <div className="screening-header">
          <h3 className="screening-title">Application Screening</h3>
        </div>
        <div className="screening-content">
          <div className="screening-message">
            <Clock size={40} className="screening-icon" />
            <p>This application has not been screened yet.</p>
          </div>
          <button 
            className="screening-action-button"
            onClick={handleManualScreen}
          >
            Run Screening Now
          </button>
        </div>
      </div>
    );
  }

  // Calculate the score breakdown percentages
  const educationScorePercent = ((screeningData.educationScore || 0) / 40) * 100;
  const experienceScorePercent = ((screeningData.experienceScore || 0) / 40) * 100;
  const skillsScorePercent = ((screeningData.skillsScore || 0) / 20) * 100;

  return (
    <div className="screening-results-container">
      <div className="screening-header">
        <h3 className="screening-title">
          {screeningData.passed ? 'Candidate Qualified' : 'Candidate Not Qualified'}
        </h3>
        {screeningData.passed ? (
          <div className="screening-badge screening-badge-success">
            <CheckCircle size={16} />
            <span>Passed</span>
          </div>
        ) : (
          <div className="screening-badge screening-badge-failed">
            <AlertCircle size={16} />
            <span>Not Passed</span>
          </div>
        )}
      </div>

      <div className="screening-content">
        <div className="screening-score-container">
          <div className="screening-score-circle">
            <div className="screening-score-value">{screeningData.score}</div>
            <div className="screening-score-label">Overall Score</div>
          </div>
          <div className="screening-threshold-info">
            <p>Passing threshold: <strong>75</strong></p>
            {screeningData.screenedAt && (
              <p className="screening-date">
                Screened on {new Date(screeningData.screenedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        <div className="screening-score-breakdown">
          <h4 className="screening-section-title">Score Breakdown</h4>
          
          <div className="screening-score-item">
            <div className="screening-score-item-header">
              <div className="screening-score-item-label">
                <BookOpen size={16} />
                <span>Education</span>
              </div>
              <div className="screening-score-item-value">{screeningData.educationScore || 0}/40</div>
            </div>
            <div className="screening-progress-bar">
              <div 
                className="screening-progress-fill"
                style={{ width: `${educationScorePercent}%` }}
              ></div>
            </div>
          </div>
          
          <div className="screening-score-item">
            <div className="screening-score-item-header">
              <div className="screening-score-item-label">
                <Clock size={16} />
                <span>Experience</span>
              </div>
              <div className="screening-score-item-value">{screeningData.experienceScore || 0}/40</div>
            </div>
            <div className="screening-progress-bar">
              <div 
                className="screening-progress-fill"
                style={{ width: `${experienceScorePercent}%` }}
              ></div>
            </div>
          </div>
          
          <div className="screening-score-item">
            <div className="screening-score-item-header">
              <div className="screening-score-item-label">
                <Award size={16} />
                <span>Skills</span>
              </div>
              <div className="screening-score-item-value">{screeningData.skillsScore || 0}/20</div>
            </div>
            <div className="screening-progress-bar">
              <div 
                className="screening-progress-fill"
                style={{ width: `${skillsScorePercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {screeningData.details && (
          <div className="screening-details">
            <h4 className="screening-section-title">Screening Details</h4>
            
            <div className="screening-details-grid">
              <div className="screening-detail-item">
                <p className="screening-detail-label">Required Education</p>
                <p className="screening-detail-value">{screeningData.details.requiredEducation || 'N/A'}</p>
              </div>
              
              <div className="screening-detail-item">
                <p className="screening-detail-label">Highest Education</p>
                <p className="screening-detail-value">{screeningData.details.highestEducation || 'N/A'}</p>
              </div>
              
              <div className="screening-detail-item">
                <p className="screening-detail-label">Required Experience</p>
                <p className="screening-detail-value">{screeningData.details.requiredExperienceYears || 0} years</p>
              </div>
              
              <div className="screening-detail-item">
                <p className="screening-detail-label">Total Experience</p>
                <p className="screening-detail-value">{screeningData.details.totalExperienceYears || 0} years</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="screening-footer">
        <button 
          className="screening-close-button"
          onClick={onClose}
        >
          Close
        </button>
        {!screeningData.passed && (
          <button 
            className="screening-override-button"
            onClick={() => {
              // This would typically call an API to override the screening result
              alert('This feature would override the screening result and mark the candidate as qualified.');
            }}
          >
            Override & Qualify
          </button>
        )}
      </div>
    </div>
  );
};

export default ScreeningResults;