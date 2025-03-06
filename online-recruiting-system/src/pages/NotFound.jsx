import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Search, HelpCircle } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <div className="not-found-status">404</div>
        <h1 className="not-found-title">Page Not Found</h1>
        <p className="not-found-message">
          The page you're looking for doesn't exist or has been moved.
        </p>
        
        <div className="not-found-actions">
          <Link to="/" className="not-found-button not-found-button-primary">
            <Home size={18} className="not-found-button-icon" />
            Back to Home
          </Link>
          <Link to="/jobs" className="not-found-button not-found-button-secondary">
            <Search size={18} className="not-found-button-icon" />
            Search Jobs
          </Link>
          <Link to="/contact" className="not-found-button not-found-button-secondary">
            <HelpCircle size={18} className="not-found-button-icon" />
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;