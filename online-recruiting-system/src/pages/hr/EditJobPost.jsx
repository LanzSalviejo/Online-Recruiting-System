import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Briefcase, 
  DollarSign, 
  MapPin, 
  Calendar,
  Save,
  AlertTriangle,
  Plus,
  Trash2
} from 'lucide-react';
import api from '../../services/api';

const EditJobPost = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    companyName: '',
    positionType: 'Full Time',
    categoryId: '',
    location: '',
    contactEmail: '',
    minEducationLevel: 'High School',
    minExperience: 0,
    description: '',
    responsibilities: [''],
    requirements: [''],
    salary: '',
    dueDate: '',
    isActive: true
  });

  // Fetch job data and categories on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch job categories
        const categoriesResponse = await api.get('/jobs/categories');
        setCategories(categoriesResponse.data);
        
        // Fetch job details
        const jobResponse = await api.get(`/jobs/${id}`);
        const job = jobResponse.data;
        
        // Parse responsibilities and requirements if they are strings
        let responsibilities = job.responsibilities;
        let requirements = job.requirements;
        
        if (typeof responsibilities === 'string') {
          try {
            responsibilities = JSON.parse(responsibilities);
          } catch (e) {
            responsibilities = [responsibilities];
          }
        }
        
        if (typeof requirements === 'string') {
          try {
            requirements = JSON.parse(requirements);
          } catch (e) {
            requirements = [requirements];
          }
        }
        
        // Format due date for input
        const dueDate = job.dueDate ? new Date(job.dueDate).toISOString().split('T')[0] : '';
        
        // Set form data
        setFormData({
          title: job.title || '',
          companyName: job.companyName || '',
          positionType: job.positionType || 'Full Time',
          categoryId: job.category_id || '',
          location: job.location || '',
          contactEmail: job.contactEmail || '',
          minEducationLevel: job.minEducationLevel || 'High School',
          minExperience: job.minExperience || 0,
          description: job.description || '',
          responsibilities: responsibilities || [''],
          requirements: requirements || [''],
          salary: job.salary || '',
          dueDate: dueDate,
          isActive: job.isActive !== false // Default to true if not specified
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching job data:', err);
        setError('Failed to load job data. Please try again later.');
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle checkbox separately
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleArrayChange = (e, index, field) => {
    const { value } = e.target;
    const newArray = [...formData[field]];
    newArray[index] = value;
    
    setFormData(prev => ({
      ...prev,
      [field]: newArray
    }));
  };

  const addArrayItem = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (index, field) => {
    if (formData[field].length === 1) return;
    
    const newArray = [...formData[field]];
    newArray.splice(index, 1);
    
    setFormData(prev => ({
      ...prev,
      [field]: newArray
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      
      // Send update request to API
      await api.put(`/jobs/${id}`, formData);
      
      // Display success message
      alert('Job posting updated successfully!');
      
      // Redirect to job postings page
      navigate('/job-postings');
    } catch (err) {
      console.error('Error updating job posting:', err);
      setError(err.response?.data?.message || 'Failed to update job posting. Please try again.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading job details...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <Link to="/job-postings" className="back-link">
          <ArrowLeft size={16} />
          Back to Job Postings
        </Link>
        <h1 className="page-title">Edit Job Posting</h1>
      </div>
      
      {error && (
        <div className="error-message">
          <AlertTriangle size={20} />
          <p>{error}</p>
        </div>
      )}
      
      <div className="job-form-container">
        <form onSubmit={handleSubmit} className="job-form">
          <div className="form-section">
            <h2 className="form-section-title">
              <Briefcase className="form-section-icon" />
              Job Details
            </h2>
            
            <div className="form-grid">
              <div className="form-group form-group-full">
                <label htmlFor="title" className="form-label">Job Title *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="e.g., Senior Frontend Developer"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="companyName" className="form-label">Company Name *</label>
                <input
                  type="text"
                  id="companyName"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="e.g., Acme Corporation"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="positionType" className="form-label">Position Type *</label>
                <select
                  id="positionType"
                  name="positionType"
                  value={formData.positionType}
                  onChange={handleChange}
                  className="form-select"
                  required
                >
                  <option value="Full Time">Full Time</option>
                  <option value="Part Time">Part Time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                  <option value="Co-op">Co-op</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="categoryId" className="form-label">Category *</label>
                <select
                  id="categoryId"
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleChange}
                  className="form-select"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="location" className="form-label">
                  <MapPin size={16} className="form-label-icon" />
                  Location *
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="e.g., Vancouver, BC or Remote"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="contactEmail" className="form-label">Contact Email *</label>
                <input
                  type="email"
                  id="contactEmail"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="e.g., careers@company.com"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="minEducationLevel" className="form-label">Minimum Education</label>
                <select
                  id="minEducationLevel"
                  name="minEducationLevel"
                  value={formData.minEducationLevel}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="High School">High School</option>
                  <option value="Associate">Associate Degree</option>
                  <option value="Diploma">Diploma</option>
                  <option value="Bachelor">Bachelor's Degree</option>
                  <option value="Master">Master's Degree</option>
                  <option value="PhD">PhD</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="minExperience" className="form-label">Minimum Experience (years)</label>
                <input
                  type="number"
                  id="minExperience"
                  name="minExperience"
                  value={formData.minExperience}
                  onChange={handleChange}
                  className="form-input"
                  min="0"
                  max="20"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="salary" className="form-label">
                  <DollarSign size={16} className="form-label-icon" />
                  Salary (yearly)
                </label>
                <input
                  type="number"
                  id="salary"
                  name="salary"
                  value={formData.salary}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="e.g., 75000"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="dueDate" className="form-label">
                  <Calendar size={16} className="form-label-icon" />
                  Application Deadline *
                </label>
                <input
                  type="date"
                  id="dueDate"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
              
              <div className="form-group form-group-checkbox">
                <label className="form-checkbox-label">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="form-checkbox"
                  />
                  <span>Active job posting</span>
                </label>
                <p className="form-help-text">
                  Inactive job postings won't appear in search results
                </p>
              </div>
            </div>
          </div>
          
          <div className="form-section">
            <h2 className="form-section-title">Job Description</h2>
            
            <div className="form-group">
              <label htmlFor="description" className="form-label">Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="form-textarea"
                rows="6"
                placeholder="Provide a detailed description of the job..."
                required
              ></textarea>
            </div>
            
            <div className="form-group">
              <label className="form-label">Responsibilities</label>
              {formData.responsibilities.map((responsibility, index) => (
                <div key={index} className="form-array-item">
                  <input
                    type="text"
                    value={responsibility}
                    onChange={(e) => handleArrayChange(e, index, 'responsibilities')}
                    className="form-input"
                    placeholder={`Responsibility #${index + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem(index, 'responsibilities')}
                    className="form-array-remove"
                    disabled={formData.responsibilities.length === 1}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('responsibilities')}
                className="form-array-add"
              >
                <Plus size={16} />
                Add Responsibility
              </button>
            </div>
            
            <div className="form-group">
              <label className="form-label">Requirements</label>
              {formData.requirements.map((requirement, index) => (
                <div key={index} className="form-array-item">
                  <input
                    type="text"
                    value={requirement}
                    onChange={(e) => handleArrayChange(e, index, 'requirements')}
                    className="form-input"
                    placeholder={`Requirement #${index + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem(index, 'requirements')}
                    className="form-array-remove"
                    disabled={formData.requirements.length === 1}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('requirements')}
                className="form-array-add"
              >
                <Plus size={16} />
                Add Requirement
              </button>
            </div>
          </div>
          
          <div className="form-actions">
            <Link 
              to="/job-postings" 
              className="form-button form-button-secondary"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="form-button form-button-primary"
            >
              <Save size={16} />
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditJobPost;