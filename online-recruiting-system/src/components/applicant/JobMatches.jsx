import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Briefcase, DollarSign, Star, AlertCircle } from 'lucide-react';
import api from '../../services/api';

const JobMatches = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchJobMatches = async () => {
      try {
        setLoading(true);
        const response = await api.get('/matching/jobs');
        setMatches(response.data.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching job matches:', err);
        setError('Failed to load job matches. Please try again later.');
        setLoading(false);
      }
    };

    fetchJobMatches();
  }, []);

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <div className="job-matches-loading">
        <div className="loading-spinner"></div>
        <p>Finding your job matches...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="job-matches-error">
        <AlertCircle size={24} />
        <p>{error}</p>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="job-matches-empty">
        <Search size={48} className="job-matches-empty-icon" />
        <h3>No job matches found</h3>
        <p>Update your job preferences to get matched with relevant positions.</p>
        <Link to="/profile/preferences" className="job-matches-action-button">
          Update Preferences
        </Link>
      </div>
    );
  }

  return (
    <div className="job-matches-container">
      <div className="job-matches-header">
        <h3 className="job-matches-title">
          <Star className="job-matches-title-icon" />
          Job Matches
        </h3>
        <Link to="/jobs" className="job-matches-view-all">
          View All Jobs
        </Link>
      </div>

      <div className="job-matches-grid">
        {matches.map(match => (
          <div key={match.jobId} className="job-match-card">
            <div className="job-match-header">
              <h4 className="job-match-title">
                <Link to={`/jobs/${match.jobId}`}>{match.title}</Link>
              </h4>
              <div className="match-score">
                <div className="match-score-value">{match.matchScore}%</div>
                <div className="match-score-label">Match</div>
              </div>
            </div>
            
            <div className="job-match-company">{match.companyName}</div>
            
            <div className="job-match-meta">
              <div className="job-match-meta-item">
                <MapPin size={16} className="job-match-meta-icon" />
                <span>{match.location}</span>
              </div>
              <div className="job-match-meta-item">
                <Briefcase size={16} className="job-match-meta-icon" />
                <span>{match.positionType}</span>
              </div>
              {match.salary && (
                <div className="job-match-meta-item">
                  <DollarSign size={16} className="job-match-meta-icon" />
                  <span>${match.salary.toLocaleString()}</span>
                </div>
              )}
            </div>
            
            <div className="job-match-footer">
              <div className="job-match-due-date">
                Due: {formatDate(match.dueDate)}
              </div>
              <Link to={`/jobs/${match.jobId}`} className="job-match-view-button">
                View Details
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default JobMatches;