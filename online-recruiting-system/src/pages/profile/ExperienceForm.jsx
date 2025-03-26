import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, X } from 'lucide-react';
import api from '../../services/api';

const ExperienceForm = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // For editing existing record
  const isEditing = !!id;
  
  const [formData, setFormData] = useState({
    jobTitle: '',
    company: '',
    industry: '',
    startDate: '',
    endDate: '',
    currentJob: false,
    responsibilities: '',
    skills: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEditing);
  const [error, setError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Fetch work experience data if editing
  useEffect(() => {
    const fetchExperience = async () => {
      if (!isEditing) return;
      
      try {
        setFetchLoading(true);
        const response = await api.get(`/profile/experience/${id}`);
        
        // Format dates for form inputs (YYYY-MM-DD)
        const experience = response.data.data;
        const formattedData = {
          ...experience,
          startDate: experience.startDate ? new Date(experience.startDate).toISOString().split('T')[0] : '',
          endDate: experience.endDate ? new Date(experience.endDate).toISOString().split('T')[0] : ''
        };
        
        setFormData(formattedData);
        setFetchLoading(false);
      } catch (err) {
        console.error('Error fetching work experience data:', err);
        setError('Failed to load work experience data. Please try again.');
        setFetchLoading(false);
      }
    };
    
    fetchExperience();
  }, [id, isEditing]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    if (name === 'currentJob' && checked) {
      // If current job is checked, clear end date
      setFormData(prev => ({ 
        ...prev, 
        [name]: newValue,
        endDate: '' 
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: newValue }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      if (isEditing) {
        // Update existing work experience
        await api.put(`/profile/experience/${id}`, formData);
        alert('Work experience updated successfully');
      } else {
        // Add new work experience
        await api.post('/profile/experience', formData);
        alert('Work experience added successfully');
      }
      
      // Redirect back to profile page
      navigate('/profile');
    } catch (err) {
      console.error('Error saving work experience:', err);
      setError(err.response?.data?.message || 'Failed to save work experience data. Please try again.');
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!isEditing) return;
    
    try {
      setLoading(true);
      await api.delete(`/profile/experience/${id}`);
      alert('Work experience deleted successfully');
      navigate('/profile');
    } catch (err) {
      console.error('Error deleting work experience:', err);
      setError(err.response?.data?.message || 'Failed to delete work experience. Please try again.');
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <Link to="/profile" className="back-link">
          <ArrowLeft size={18} />
          Back to Profile
        </Link>
        <h1 className="page-title">{isEditing ? 'Edit Work Experience' : 'Add Work Experience'}</h1>
      </div>
      
      {error && (
        <div className="error-message">
          {error}
          <button className="error-dismiss" onClick={() => setError(null)}>
            <X size={18} />
          </button>
        </div>
      )}
      
      <div className="form-container">
        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="jobTitle" className="form-label">Job Title *</label>
              <input 
                type="text" 
                id="jobTitle" 
                name="jobTitle" 
                value={formData.jobTitle} 
                onChange={handleChange}
                className="form-input"
                placeholder="e.g. Software Engineer"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="company" className="form-label">Company *</label>
              <input 
                type="text" 
                id="company" 
                name="company" 
                value={formData.company} 
                onChange={handleChange}
                className="form-input"
                placeholder="e.g. Google"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="industry" className="form-label">Industry</label>
              <input 
                type="text" 
                id="industry" 
                name="industry" 
                value={formData.industry} 
                onChange={handleChange}
                className="form-input"
                placeholder="e.g. Technology"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="startDate" className="form-label">Start Date *</label>
              <input 
                type="date" 
                id="startDate" 
                name="startDate" 
                value={formData.startDate} 
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
            
            <div className="form-group">
              <div className="form-checkbox-container">
                <input 
                  type="checkbox" 
                  id="currentJob" 
                  name="currentJob" 
                  checked={formData.currentJob} 
                  onChange={handleChange}
                  className="form-checkbox"
                />
                <label htmlFor="currentJob" className="form-checkbox-label">
                  I currently work here
                </label>
              </div>
            </div>
            
            {!formData.currentJob && (
              <div className="form-group">
                <label htmlFor="endDate" className="form-label">End Date *</label>
                <input 
                  type="date" 
                  id="endDate" 
                  name="endDate" 
                  value={formData.endDate} 
                  onChange={handleChange}
                  className="form-input"
                  required={!formData.currentJob}
                  disabled={formData.currentJob}
                />
              </div>
            )}
            
            <div className="form-group form-group-full">
              <label htmlFor="responsibilities" className="form-label">Responsibilities *</label>
              <textarea 
                id="responsibilities" 
                name="responsibilities" 
                value={formData.responsibilities} 
                onChange={handleChange}
                className="form-textarea"
                placeholder="Describe your responsibilities and achievements in this role"
                rows={4}
                required
              />
            </div>
            
            <div className="form-group form-group-full">
              <label htmlFor="skills" className="form-label">Skills</label>
              <input 
                type="text" 
                id="skills" 
                name="skills" 
                value={formData.skills} 
                onChange={handleChange}
                className="form-input"
                placeholder="e.g. JavaScript, React, Node.js, Project Management"
              />
              <div className="form-help-text">
                Enter skills separated by commas. These will help match you with relevant jobs.
              </div>
            </div>
          </div>
          
          <div className="form-actions">
            {isEditing && (
              <div className="delete-container">
                {confirmDelete ? (
                  <div className="confirm-delete">
                    <span>Are you sure?</span>
                    <button 
                      type="button" 
                      className="delete-confirm-button"
                      onClick={handleDelete}
                      disabled={loading}
                    >
                      Yes, Delete
                    </button>
                    <button 
                      type="button" 
                      className="delete-cancel-button"
                      onClick={() => setConfirmDelete(false)}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button 
                    type="button" 
                    className="delete-button"
                    onClick={() => setConfirmDelete(true)}
                    disabled={loading}
                  >
                    <Trash2 size={18} />
                    Delete
                  </button>
                )}
              </div>
            )}
            
            <div className="main-actions">
              <Link 
                to="/profile" 
                className="cancel-button"
              >
                Cancel
              </Link>
              <button 
                type="submit" 
                className="save-button"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="button-spinner"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    {isEditing ? 'Update Experience' : 'Save Experience'}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExperienceForm;