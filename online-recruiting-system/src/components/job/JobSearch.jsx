import React, { useState, useEffect } from 'react';
import { Search, Filter, X, MapPin } from 'lucide-react';

const JobSearch = ({ onSearch }) => {
  const [filters, setFilters] = useState({
    keyword: '',
    location: '',
    category: '',
    positionType: '',
    minSalary: '',
    dueDate: ''
  });
  
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState([]);
  
  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // Mock data for demonstration - would be replaced with API call
        setCategories([
          { _id: '1', name: 'Information Technology' },
          { _id: '2', name: 'Business' },
          { _id: '3', name: 'Marketing' },
          { _id: '4', name: 'Finance' },
          { _id: '5', name: 'Healthcare' },
          { _id: '6', name: 'Education' },
          { _id: '7', name: 'Sales' },
          { _id: '8', name: 'Engineering' },
          { _id: '9', name: 'Customer Service' },
          { _id: '10', name: 'Human Resources' }
        ]);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    
    fetchCategories();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    onSearch(filters);
  };

  const handleClearFilters = () => {
    setFilters({
      keyword: '',
      location: '',
      category: '',
      positionType: '',
      minSalary: '',
      dueDate: ''
    });
    
    // Also trigger search with cleared filters
    onSearch({
      keyword: '',
      location: '',
      category: '',
      positionType: '',
      minSalary: '',
      dueDate: ''
    });
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  return (
    <div className="search-container">
      <form onSubmit={handleSearch}>
        <div className="search-main-row">
          <div className="search-input-wrapper">
            <Search className="search-icon" />
            <input
              type="text"
              name="keyword"
              value={filters.keyword}
              onChange={handleInputChange}
              placeholder="Job title, keywords, or company"
              className="search-input"
            />
          </div>
          
          <div className="search-input-wrapper">
            <MapPin className="search-icon" />
            <input
              type="text"
              name="location"
              value={filters.location}
              onChange={handleInputChange}
              placeholder="City, state, or remote"
              className="search-input"
            />
          </div>
          
          <div className="search-buttons">
            <button
              type="submit"
              className="search-button"
            >
              Search
            </button>
            
            <button
              type="button"
              onClick={toggleFilters}
              className="filter-toggle-button"
            >
              <Filter />
            </button>
          </div>
        </div>
        
        {showFilters && (
          <div className="advanced-filters">
            <div className="filter-grid">
              <div className="filter-group">
                <label htmlFor="category" className="filter-label">
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={filters.category}
                  onChange={handleInputChange}
                  className="filter-select"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="filter-group">
                <label htmlFor="positionType" className="filter-label">
                  Job Type
                </label>
                <select
                  id="positionType"
                  name="positionType"
                  value={filters.positionType}
                  onChange={handleInputChange}
                  className="filter-select"
                >
                  <option value="">All Types</option>
                  <option value="Full Time">Full Time</option>
                  <option value="Part Time">Part Time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                  <option value="Co-op">Co-op</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label htmlFor="minSalary" className="filter-label">
                  Minimum Salary
                </label>
                <input
                  type="number"
                  id="minSalary"
                  name="minSalary"
                  value={filters.minSalary}
                  onChange={handleInputChange}
                  placeholder="e.g., 50000"
                  className="filter-input"
                />
              </div>
              
              <div className="filter-group">
                <label htmlFor="dueDate" className="filter-label">
                  Application Due Date
                </label>
                <input
                  type="date"
                  id="dueDate"
                  name="dueDate"
                  value={filters.dueDate}
                  onChange={handleInputChange}
                  className="filter-input"
                />
              </div>
            </div>
            
            <div className="filter-actions">
              <button
                type="button"
                onClick={handleClearFilters}
                className="clear-filters-button"
              >
                <X className="clear-icon" />
                <span>Clear Filters</span>
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default JobSearch;