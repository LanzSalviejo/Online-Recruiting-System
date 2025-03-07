import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import JobSearch from '../../components/job/JobSearch';
import JobCard from '../../components/job/JobCard';
import { ArrowUp } from 'lucide-react';
import api from '../../services/api';

const JobListings = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    keyword: '',
    location: '',
    category: '',
    positionType: '',
    minSalary: '',
    dueDate: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  const JOBS_PER_PAGE = 6;

  // Extract search params from URL on initial load
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const urlFilters = {
      keyword: searchParams.get('keyword') || '',
      location: searchParams.get('location') || '',
      category: searchParams.get('category') || '',
      positionType: searchParams.get('positionType') || '',
      minSalary: searchParams.get('minSalary') || '',
      dueDate: searchParams.get('dueDate') || ''
    };
    
    setFilters(urlFilters);
    
    const page = parseInt(searchParams.get('page')) || 1;
    setCurrentPage(page);
  }, [location.search]);

  // Fetch jobs from the API
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        
        // Build query params for API request
        const queryParams = new URLSearchParams();
        
        // Add filters to query params
        if (filters.keyword) queryParams.append('keyword', filters.keyword);
        if (filters.location) queryParams.append('location', filters.location);
        if (filters.category) queryParams.append('category', filters.category);
        if (filters.positionType) queryParams.append('positionType', filters.positionType);
        if (filters.minSalary) queryParams.append('minSalary', filters.minSalary);
        if (filters.dueDate) queryParams.append('dueDate', filters.dueDate);
        
        // Add pagination params
        queryParams.append('page', currentPage);
        queryParams.append('limit', JOBS_PER_PAGE);
        
        // Make API request
        const response = await api.get(`/jobs?${queryParams.toString()}`);
        
        // Update state with response data
        setJobs(response.data.jobs);
        setTotalPages(response.data.totalPages);
        setTotalJobs(response.data.totalJobs);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching jobs:', err);
        setError('Failed to load jobs. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchJobs();
  }, [filters, currentPage]);

  // Update URL with current filters and pagination
  useEffect(() => {
    const queryParams = new URLSearchParams();
    
    // Add non-empty filters to URL
    if (filters.keyword) queryParams.set('keyword', filters.keyword);
    if (filters.location) queryParams.set('location', filters.location);
    if (filters.category) queryParams.set('category', filters.category);
    if (filters.positionType) queryParams.set('positionType', filters.positionType);
    if (filters.minSalary) queryParams.set('minSalary', filters.minSalary);
    if (filters.dueDate) queryParams.set('dueDate', filters.dueDate);
    
    // Add current page to URL if not the first page
    if (currentPage > 1) {
      queryParams.set('page', currentPage);
    }
    
    // Update URL without causing a refresh
    const queryString = queryParams.toString();
    const newUrl = queryString ? `?${queryString}` : '';
    
    navigate(newUrl, { replace: true });
  }, [filters, currentPage, navigate]);

  // Handle search form submission
  const handleSearch = (searchFilters) => {
    setFilters(searchFilters);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Handle pagination
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle scroll to top
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.pageYOffset > 300);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Job Listings</h1>
      
      <JobSearch onSearch={handleSearch} initialFilters={filters} />
      
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading jobs...</p>
        </div>
      ) : error ? (
        <div className="error-message">
          {error}
        </div>
      ) : jobs.length === 0 ? (
        <div className="no-results">
          <div className="no-results-title">No jobs found</div>
          <p className="no-results-message">
            Try adjusting your search filters to find more results.
          </p>
        </div>
      ) : (
        <>
          <div className="results-count">
            Showing {jobs.length} of {totalJobs} {totalJobs === 1 ? 'job' : 'jobs'}
          </div>
          
          <div className="job-grid">
            {jobs.map(job => (
              <JobCard key={job._id} job={job} />
            ))}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <div className="pagination-controls">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="pagination-button pagination-prev"
                >
                  Previous
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`pagination-button ${
                      currentPage === page 
                        ? 'pagination-button-active' 
                        : ''
                    }`}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="pagination-button pagination-next"
                >
                  Next
                </button>
              </div>
            </div>
          )}
          
          {/* Scroll to top button */}
          {showScrollTop && (
            <button
              onClick={scrollToTop}
              className="scroll-top-button"
              aria-label="Scroll to top"
            >
              <ArrowUp size={20} />
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default JobListings;