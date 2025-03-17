import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Search, 
  Briefcase, 
  Users, 
  BarChart2, 
  CheckCircle 
} from 'lucide-react';
import api from '../services/api';
import JobSearch from '../components/job/JobSearch';

const Home = () => {
  const { user } = useAuth();
  const [featuredJobs, setFeaturedJobs] = useState([]);
  const [jobCategories, setJobCategories] = useState([]);
  const [stats, setStats] = useState({
    totalJobs: 0,
    totalCompanies: 0,
    totalApplicants: 0,
    jobsThisMonth: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true);
        
        // Fetch featured jobs
        const jobsResponse = await api.get('/jobs/featured');
        setFeaturedJobs(jobsResponse.data);
        
        // Fetch job categories
        const categoriesResponse = await api.get('/jobs/categories');
        setJobCategories(categoriesResponse.data);
        
        // Fetch platform stats
        const statsResponse = await api.get('/stats/platform');
        setStats(statsResponse.data);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching home data:', error);
        setError('Failed to load content. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchHomeData();
  }, []);

  const handleSearch = (searchParams) => {
    // Navigate to jobs page with search params
    // This would typically use useNavigate and URLSearchParams
    // to construct the query string
    console.log('Search params:', searchParams);
    window.location.href = `/jobs?keyword=${searchParams.keyword}&location=${searchParams.location}`;
  };

  // Format date to readable format
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // If user is logged in, redirect to appropriate dashboard
  if (user) {
    if (user.accountType === 'applicant') {
      return <Navigate to="/dashboard" />;
    } else if (user.accountType === 'hr') {
      return <Navigate to="/hr/dashboard" />;
    } else if (user.accountType === 'admin') {
      return <Navigate to="/admin/dashboard" />;
    }
  }

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Find Your Dream Job Today</h1>
          <p className="hero-subtitle">
            Browse thousands of job opportunities and find the perfect match for your skills and career goals
          </p>
          
          <div className="hero-search">
            <JobSearch onSearch={handleSearch} />
          </div>
        </div>
      </section>
      
      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-container">
          <div className="stat-item">
            <div className="stat-icon-wrapper">
              <Briefcase className="stat-icon" />
            </div>
            <div className="stat-content">
              <h3 className="stat-number">{stats.totalJobs.toLocaleString()}</h3>
              <p className="stat-label">Jobs Available</p>
            </div>
          </div>
          
          <div className="stat-item">
            <div className="stat-icon-wrapper">
              <Users className="stat-icon" />
            </div>
            <div className="stat-content">
              <h3 className="stat-number">{stats.totalCompanies.toLocaleString()}</h3>
              <p className="stat-label">Companies</p>
            </div>
          </div>
          
          <div className="stat-item">
            <div className="stat-icon-wrapper">
              <CheckCircle className="stat-icon" />
            </div>
            <div className="stat-content">
              <h3 className="stat-number">{stats.totalApplicants.toLocaleString()}</h3>
              <p className="stat-label">Happy Applicants</p>
            </div>
          </div>
          
          <div className="stat-item">
            <div className="stat-icon-wrapper">
              <BarChart2 className="stat-icon" />
            </div>
            <div className="stat-content">
              <h3 className="stat-number">{stats.jobsThisMonth.toLocaleString()}</h3>
              <p className="stat-label">Jobs This Month</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Featured Jobs Section */}
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">Featured Jobs</h2>
          <Link to="/jobs" className="section-link">
            View All Jobs
          </Link>
        </div>
        
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading jobs...</p>
          </div>
        ) : error ? (
          <div className="error-message">
            {error}
          </div>
        ) : (
          <div className="featured-jobs-grid">
            {featuredJobs.map(job => (
              <div key={job._id} className="featured-job-card">
                <div className="featured-job-content">
                  <h3 className="featured-job-title">
                    <Link to={`/jobs/${job._id}`}>{job.title}</Link>
                  </h3>
                  <p className="featured-job-company">{job.companyName}</p>
                  <div className="featured-job-meta">
                    <span className="featured-job-location">{job.location}</span>
                    <span className="featured-job-type">{job.positionType}</span>
                  </div>
                  <p className="featured-job-description">{job.description.substring(0, 120)}...</p>
                </div>
                <div className="featured-job-footer">
                  <span className="featured-job-date">Posted on {formatDate(job.postDate)}</span>
                  <Link to={`/jobs/${job._id}`} className="featured-job-button">
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      
      {/* Categories Section */}
      <section className="section categories-section">
        <div className="section-header">
          <h2 className="section-title">Job Categories</h2>
          <Link to="/jobs" className="section-link">
            Browse All Categories
          </Link>
        </div>
        
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading categories...</p>
          </div>
        ) : (
          <div className="categories-grid">
            {jobCategories.map(category => (
              <Link 
                to={`/jobs?category=${category._id}`}
                key={category._id}
                className="category-card"
              >
                <div className="category-content">
                  <h3 className="category-title">{category.name}</h3>
                  <p className="category-count">{category.jobCount} Jobs</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
      
      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">Ready to Start Your Career Journey?</h2>
          <p className="cta-text">
            Create an account to apply for jobs, get personalized recommendations,
            and track your applications all in one place.
          </p>
          <div className="cta-buttons">
            <Link to="/register" className="cta-button-primary">
              Create an Account
            </Link>
            <Link to="/jobs" className="cta-button-secondary">
              Browse Jobs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;