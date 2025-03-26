import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, X } from 'lucide-react';
import api from '../../services/api';

const EducationForm = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // For editing existing record
  const isEditing = !!id;
  
  const [formData, setFormData] = useState({
    degreeLevel: '',
    fieldOfStudy: '',
    institution: '',
    startDate: '',
    endDate: '',
    gpa: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEditing);
  const [error, setError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Fetch education data if editing
  useEffect(() => {
    const fetchEducation = async () => {
      if (!isEditing) return;
      
      try {
        setFetchLoading(true);
        const response = await api.get(`/profile/education/${id}`);
        
        // Format dates for form inputs (YYYY-MM-DD)
        const education = response.data.data;
        const formattedData = {
          ...education,
          startDate: education.startDate ? new Date(education.startDate).toISOString().split('T')[0] : '',
          endDate: education.endDate ? new Date(education.endDate).toISOString().split('T')[0] : ''
        };
        
        setFormData(formattedData);
        setFetchLoading(false);
      } catch (err) {
        console.error('Error fetching education data:', err);
        setError('Failed to load education data. Please try again.');
        setFetchLoading(false);
      }
    };
    
    fetchEducation();
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
        // Update existing education
        await api.put(`/profile/education/${id}`, formData);
        alert('Education updated successfully');
      } else {
        // Add new education
        await api.post('/profile/education', formData);
        alert('Education added successfully');
      }
      
      // Redirect back to profile page
      navigate('/profile');
    } catch (err) {
      console.error('Error saving education:', err);
      setError(err.response?.data?.message || 'Failed to save education data. Please try again.');
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!isEditing) return;
    
    try {
      setLoading(true);
      await api.delete(`/profile/education/${id}`);
      alert('Education deleted successfully');
      navigate('/profile');
    } catch (err) {
      console.error('Error deleting education:', err);
      setError(err.response?.data?.message || 'Failed to delete education. Please try again.');
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
        <h1 className="page-title">{isEditing ? 'Edit Education' : 'Add Education'}</h1>
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
              <label htmlFor="degreeLevel" className="form-label">Degree Level *</label>
              <select 
                id="degreeLevel" 
                name="degreeLevel" 
                value={formData.degreeLevel} 
                onChange={handleChange}
                className="form-select"
                required
              >
                <option value="">Select Degree Level</option>
                <option value="High School">High School</option>
                <option value="Diploma">Diploma</option>
                <option value="Associate">Associate Degree</option>
                <option value="Bachelor">Bachelor's Degree</option>
                <option value="Master">Master's Degree</option>
                <option value="PhD">Doctorate</option>
                <option value="Certificate">Certificate</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="fieldOfStudy" className="form-label">Field of Study *</label>
              <input 
                type="text" 
                id="fieldOfStudy" 
                name="fieldOfStudy" 
                value={formData.fieldOfStudy} 
                onChange={handleChange}
                className="form-input"
                placeholder="e.g. Computer Science, Business Administration"
                required
              />
            </div>
            
            <div className="form-group form-group-full">
              <label htmlFor="institution" className="form-label">Institution *</label>
              <input 
                type="text" 
                id="institution" 
                name="institution" 
                value={formData.institution} 
                onChange={handleChange}
                className="form-input"
                placeholder="e.g. University of California, Berkeley"
                required
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
              <label htmlFor="endDate" className="form-label">End Date *</label>
              <input 
                type="date" 
                id="endDate" 
                name="endDate" 
                value={formData.endDate} 
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="gpa" className="form-label">GPA</label>
              <input 
                type="text" 
                id="gpa" 
                name="gpa" 
                value={formData.gpa} 
                onChange={handleChange}
                className="form-input"
                placeholder="e.g. 3.8"
              />
              <div className="form-help-text">Optional. Enter your GPA on a scale of 0-4.0</div>
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
                    {isEditing ? 'Update Education' : 'Save Education'}
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

export default EducationForm;