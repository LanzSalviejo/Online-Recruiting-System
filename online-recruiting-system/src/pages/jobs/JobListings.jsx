import React, { useState, useEffect } from 'react';
import JobSearch from '../components/job/JobSearch';
import JobCard from '../components/job/JobCard';
import { ArrowUp } from 'lucide-react';

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
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Mock job data for demonstration
  const mockJobs = [
    {
      _id: '1',
      title: 'Frontend Developer',
      companyName: 'Tech Solutions',
      location: 'Vancouver, BC',
      positionType: 'Full Time',
      categoryName: 'Information Technology',
      salary: 90000,
      description: 'We are seeking a skilled Frontend Developer to join our team. You will be responsible for building user interfaces using modern web technologies.',
      postDate: new Date('2025-01-15'),
      dueDate: new Date('2025-03-15')
    },
    {
      _id: '2',
      title: 'UX/UI Designer',
      companyName: 'Creative Studio',
      location: 'Toronto, ON',
      positionType: 'Full Time',
      categoryName: 'Design',
      salary: 85000,
      description: 'Looking for a talented UX/UI Designer to create intuitive and engaging user experiences for our clients across multiple platforms.',
      postDate: new Date('2025-01-20'),
      dueDate: new Date('2025-03-10')
    },
    {
      _id: '3',
      title: 'Marketing Specialist',
      companyName: 'Global Brands Inc.',
      location: 'Remote',
      positionType: 'Part Time',
      categoryName: 'Marketing',
      salary: 65000,
      description: 'Join our marketing team to develop and implement marketing strategies across digital channels.',
      postDate: new Date('2025-02-01'),
      dueDate: new Date('2025-03-20')
    },
    {
      _id: '4',
      title: 'Backend Developer',
      companyName: 'Innovate Systems',
      location: 'Montreal, QC',
      positionType: 'Contract',
      categoryName: 'Information Technology',
      salary: 95000,
      description: 'Experienced Backend Developer needed to work on our cloud-based applications using modern server technologies.',
      postDate: new Date('2025-01-25'),
      dueDate: new Date('2025-03-25')
    },
    {
      _id: '5',
      title: 'Accountant',
      companyName: 'Financial Services Ltd.',
      location: 'Calgary, AB',
      positionType: 'Full Time',
      categoryName: 'Finance',
      salary: 75000,
      description: 'We are looking for a detailed-oriented Accountant to join our financial team. CPA designation preferred.',
      postDate: new Date('2025-02-05'),
      dueDate: new Date('2025-04-05')
    },
    {
      _id: '6',
      title: 'Content Writer',
      companyName: 'Digital Media Co.',
      location: 'Ottawa, ON',
      positionType: 'Part Time',
      categoryName: 'Marketing',
      salary: 60000,
      description: 'Creative Content Writer needed to produce engaging content for various digital platforms.',
      postDate: new Date('2025-02-10'),
      dueDate: new Date('2025-03-31')
    }
  ];

  // Simulating API fetch
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        
        // Simulating backend filtering and pagination logic
        let filteredJobs = [...mockJobs];
        
        // Apply filters
        if (filters.keyword) {
          const keyword = filters.keyword.toLowerCase();
          filteredJobs = filteredJobs.filter(job => 
            job.title.toLowerCase().includes(keyword) || 
            job.description.toLowerCase().includes(keyword) ||
            job.companyName.toLowerCase().includes(keyword)
          );
        }
        
        if (filters.location) {
          const location = filters.location.toLowerCase();
          filteredJobs = filteredJobs.filter(job => 
            job.location.toLowerCase().includes(location)
          );
        }
        
        if (filters.category) {
          filteredJobs = filteredJobs.filter(job => 
            job.categoryName === filters.category
          );
        }
        
        if (filters.positionType) {
          filteredJobs = filteredJobs.filter(job => 
            job.positionType === filters.positionType
          );
        }
        
        if (filters.minSalary) {
          const minSalary = parseInt(filters.minSalary);
          filteredJobs = filteredJobs.filter(job => 
            job.salary >= minSalary
          );
        }
        
        if (filters.dueDate) {
          const dueDate = new Date(filters.dueDate);
          filteredJobs = filteredJobs.filter(job => 
            new Date(job.dueDate) >= dueDate
          );
        }
        
        // Calculate pagination
        const jobsPerPage = 4;
        const totalItems = filteredJobs.length;
        const totalPages = Math.ceil(totalItems / jobsPerPage);
        
        // Get current page items
        const startIndex = (currentPage - 1) * jobsPerPage;
        const endIndex = Math.min(startIndex + jobsPerPage, totalItems);
        const paginatedJobs = filteredJobs.slice(startIndex, endIndex);
        
        setJobs(paginatedJobs);
        setTotalPages(totalPages);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching jobs:', error);
        setError('Failed to fetch jobs. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchJobs();
  }, [filters, currentPage]);

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
      
      <JobSearch onSearch={handleSearch} />
      
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
            Showing {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'}
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