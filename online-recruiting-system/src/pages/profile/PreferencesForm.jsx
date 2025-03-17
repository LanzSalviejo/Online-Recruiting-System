import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, X } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-toastify';

const PreferencesForm = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // For editing existing record
  const isEditing = !!id;
  
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    positionType: '',
    category: '',
    location: '',
    minSalary: '',
    keywords: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Fetch job categories and preference data if editing
  useEffect(() => {
    const fetchData = async () => {
      try {
        setFetchLoading(true);
        
        // Fetch job categories
        const categoriesResponse = await api.get('/jobs/categories');
        setCategories(categoriesResponse.data);
        
        // If editing, fetch preference data
        if (isEditing) {
          const preferenceResponse = await api.get(`/profile/preferences/${id}`);
          setFormData(preferenceResponse.data.data);
        }
        
        setFetchLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load form data. Please try again.');
        setFetchLoading(false);
      }
    };
    
    fetchData();
  }, [id, isEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      if (isEditing) {
        // Update existing preference
        await api.put(`/profile/preferences/${id}`, formData);
        toast.success('Job preference updated successfully');
      } else {
        // Add new preference
        await api.post('/profile/preferences', formData);
        toast.success('Job preference added successfully');
      }
      
      // Redirect back to profile page
      navigate('/profile');
    } catch (err) {
      console.error('Error saving job preference:', err);
      setError(err.response?.data?.message || 'Failed to save job preference data. Please try again.');
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!isEditing) return;
    
    try {
      setLoading(true);
      await api.delete(`/profile/preferences/${id}`);
      toast.success('Job preference deleted successfully');
      navigate('/profile');
    } catch (err) {
      console.error('Error deleting job preference:', err);
      setError(err.response?.data?.message || 'Failed to delete job preference. Please try again.');
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading...</p>
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
        <h1 className="page-title">{isEditing ? 'Edit Job Preference' : 'Add Job Preference'}</h1>
      </div>
      
      {error && (
        <div className="error-message">
          {error}
          <button className="error-close" onClick={() => setError(null)}>
            <X size={18} />
          </button>
        </div>
      )}
      
      <div className="form-container">
        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="category" className="form-label">Job Category *</label>
              <select 
                id="category" 
                name="category" 
                value={formData.category} 
                onChange={handleChange}
                className="form-select"
                required
              >
                <option value="">Select Job Category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
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
                <option value="">Select Position Type</option>
                <option value="Full Time">Full Time</option>
                <option value="Part Time">Part Time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
                <option value="Co-op">Co-op</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="location" className="form-label">Preferred Location *</label>
              <input 
                type="text" 
                id="location" 
                name="location" 
                value={formData.location} 
                onChange={handleChange}
                className="form-input"
                placeholder="e.g. San Francisco, Remote, New York"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="minSalary" className="form-label">Minimum Salary ($)</label>
              <input 
                type="number" 
                id="minSalary" 
                name="minSalary" 
                value={formData.minSalary} 
                onChange={handleChange}
                className="form-input"
                placeholder="e.g. 60000"
                min="0"
                step="1000"
              />
              <div className="form-help-text">Optional. Enter your minimum acceptable salary (annual).</div>
            </div>
            
            <div className="form-group form-group-full">
              <label htmlFor="keywords" className="form-label">Keywords</label>
              <textarea 
                id="keywords" 
                name="keywords" 
                value={formData.keywords} 
                onChange={handleChange}
                className="form-textarea"
                placeholder="Enter keywords separated by commas (e.g. JavaScript, React, Remote)"
                rows={3}
              />
              <div className="form-help-text">Optional. Enter keywords to help match you with relevant jobs (comma separated).</div>
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
                    {isEditing ? 'Update Preference' : 'Save Preference'}
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

export default PreferencesForm;