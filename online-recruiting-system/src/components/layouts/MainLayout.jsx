import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Menu, X } from 'lucide-react';

const MainLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="main-container">
      <header className="main-header">
        <div className="header-container">
          <Link to="/" className="site-title">Online Recruiting System</Link>
          
          {/* Mobile menu button */}
          <button 
            className="mobile-menu-button"
            onClick={toggleMobileMenu}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          
          {/* Desktop Navigation */}
          <nav className="desktop-nav">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/jobs" className="nav-link">Browse Jobs</Link>
            {user && (
              <>
                {user.accountType === 'applicant' && (
                  <Link to="/applications" className="nav-link">My Applications</Link>
                )}
                {user.accountType === 'hr' && (
                  <>
                    <Link to="/job-postings" className="nav-link">Job Postings</Link>
                    <Link to="/applications-review" className="nav-link">Review Applications</Link>
                  </>
                )}
                {user.accountType === 'admin' && (
                  <>
                    <Link to="/manage-users" className="nav-link">Manage Users</Link>
                    <Link to="/categories" className="nav-link">Job Categories</Link>
                    <Link to="/reports" className="nav-link">Reports</Link>
                  </>
                )}
              </>
            )}
          </nav>

          <div className="header-actions">
            {user ? (
              <div className="user-actions">
                <Link to="/profile" className="profile-link">
                  <img 
                    src={user.imagePath || '/images/default-avatar.png'} 
                    alt="Profile" 
                    className="profile-image"
                  />
                  <span className="profile-name">{user.firstName}</span>
                </Link>
                <button 
                  onClick={handleLogout}
                  className="logout-button"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="auth-buttons">
                <Link 
                  to="/login" 
                  className="login-button"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="register-button"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
        
        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="mobile-nav">
            <div className="mobile-nav-links">
              <Link 
                to="/" 
                className="mobile-nav-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                to="/jobs" 
                className="mobile-nav-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                Browse Jobs
              </Link>
              
              {user && (
                <>
                  {user.accountType === 'applicant' && (
                    <Link 
                      to="/applications" 
                      className="mobile-nav-link"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      My Applications
                    </Link>
                  )}
                  {user.accountType === 'hr' && (
                    <>
                      <Link 
                        to="/job-postings" 
                        className="mobile-nav-link"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Job Postings
                      </Link>
                      <Link 
                        to="/applications-review" 
                        className="mobile-nav-link"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Review Applications
                      </Link>
                    </>
                  )}
                  {user.accountType === 'admin' && (
                    <>
                      <Link 
                        to="/manage-users" 
                        className="mobile-nav-link"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Manage Users
                      </Link>
                      <Link 
                        to="/categories" 
                        className="mobile-nav-link"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Job Categories
                      </Link>
                      <Link 
                        to="/reports" 
                        className="mobile-nav-link"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Reports
                      </Link>
                    </>
                  )}
                  
                  <Link 
                    to="/profile" 
                    className="mobile-nav-link"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    My Profile
                  </Link>
                  <button 
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="mobile-nav-link mobile-logout"
                  >
                    Logout
                  </button>
                </>
              )}
              
              {!user && (
                <>
                  <Link 
                    to="/login" 
                    className="mobile-nav-link"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link 
                    to="/register" 
                    className="mobile-nav-link"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="main-content">
        {children}
      </main>

      <footer className="main-footer">
        <div className="footer-container">
          <div className="footer-content">
            <div className="footer-info">
              <h3 className="footer-title">Online Recruiting System</h3>
              <p className="footer-tagline">Simplifying the hiring process</p>
            </div>
            
            <div className="footer-links-grid">
              <div className="footer-link-group">
                <h4 className="footer-link-title">For Applicants</h4>
                <ul className="footer-link-list">
                  <li>
                    <Link to="/jobs" className="footer-link">
                      Find Jobs
                    </Link>
                  </li>
                  <li>
                    <Link to="/register" className="footer-link">
                      Create Account
                    </Link>
                  </li>
                  <li>
                    <Link to="/faq" className="footer-link">
                      FAQ
                    </Link>
                  </li>
                </ul>
              </div>
              
              <div className="footer-link-group">
                <h4 className="footer-link-title">For Employers</h4>
                <ul className="footer-link-list">
                  <li>
                    <Link to="/contact" className="footer-link">
                      Contact Us
                    </Link>
                  </li>
                  <li>
                    <Link to="/about" className="footer-link">
                      About
                    </Link>
                  </li>
                </ul>
              </div>
              
              <div className="footer-link-group">
                <h4 className="footer-link-title">Connect With Us</h4>
                <div className="social-links">
                  <a href="#" className="social-link">
                    <span className="sr-only">LinkedIn</span>
                    <svg className="social-icon" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                    </svg>
                  </a>
                  <a href="#" className="social-link">
                    <span className="sr-only">Twitter</span>
                    <svg className="social-icon" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 9.99 9.99 0 01-3.127 1.195 4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
          
          <div className="footer-copyright">
            <p>© {new Date().getFullYear()} Online Recruiting System. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
