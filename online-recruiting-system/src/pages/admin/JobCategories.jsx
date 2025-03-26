import React, { useState, useEffect } from 'react';
import { Folder, Plus, Edit, Trash2, Save, X, AlertTriangle } from 'lucide-react';
import api from '../../services/api';

const JobCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get('/jobs/categories');
      setCategories(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load job categories. Please try again.');
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/jobs/categories', formData);
      setCategories([...categories, response.data]);
      setFormData({ name: '', description: '' });
      setShowAddForm(false);
    } catch (err) {
      console.error('Error adding category:', err);
      setError('Failed to add category. Please try again.');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put(`/jobs/categories/${editingId}`, formData);
      setCategories(categories.map(cat => 
        cat.id === editingId ? response.data : cat
      ));
      setEditingId(null);
      setFormData({ name: '', description: '' });
    } catch (err) {
      console.error('Error updating category:', err);
      setError('Failed to update category. Please try again.');
    }
  };

  const startEditing = (category) => {
    setEditingId(category.id);
    setFormData({
      name: category.name,
      description: category.description || ''
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setFormData({ name: '', description: '' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this category? This cannot be undone.')) {
      try {
        await api.delete(`/jobs/categories/${id}`);
        setCategories(categories.filter(cat => cat.id !== id));
      } catch (err) {
        console.error('Error deleting category:', err);
        setError('Failed to delete category. It may be in use by existing job postings.');
      }
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading job categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header-with-actions">
        <h1 className="page-title">Job Categories</h1>
        <button 
          className="primary-button"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <Plus size={16} />
          Add Category
        </button>
      </div>
      
      {error && (
        <div className="error-message">
          <AlertTriangle size={20} />
          <p>{error}</p>
          <button 
            className="close-error-button"
            onClick={() => setError(null)}
          >
            <X size={16} />
          </button>
        </div>
      )}
      
      {showAddForm && (
        <div className="user-edit-container" style={{ marginBottom: '2rem' }}>
          <div className="user-info-header">
            <h2 className="user-header-name">Add New Category</h2>
          </div>
          <form onSubmit={handleAddSubmit} className="user-edit-form">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="name" className="form-label">Category Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="description" className="form-label">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="form-input"
                  rows="3"
                />
              </div>
            </div>
            
            <div className="form-actions">
              <button 
                type="button" 
                onClick={() => setShowAddForm(false)}
                className="button-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="button-primary">
                <Plus size={16} />
                Add Category
              </button>
            </div>
          </form>
        </div>
      )}
      
      {categories.length === 0 ? (
        <div className="no-data-container">
          <Folder size={48} className="no-data-icon" />
          <h3 className="no-data-title">No Categories Found</h3>
          <p className="no-data-text">Create job categories to help organize job postings.</p>
          <button 
            className="primary-button"
            onClick={() => setShowAddForm(true)}
          >
            <Plus size={16} />
            Add First Category
          </button>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
          gap: '1.5rem' 
        }}>
          {categories.map(category => (
            <div key={category.id} className="user-edit-container" style={{ height: '100%' }}>
              {editingId === category.id ? (
                <form onSubmit={handleEditSubmit} className="user-edit-form">
                  <div className="form-group">
                    <label htmlFor={`edit-name-${category.id}`} className="form-label">Name</label>
                    <input
                      type="text"
                      id={`edit-name-${category.id}`}
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor={`edit-description-${category.id}`} className="form-label">Description</label>
                    <textarea
                      id={`edit-description-${category.id}`}
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      className="form-input"
                      rows="3"
                    />
                  </div>
                  
                  <div className="form-actions">
                    <button 
                      type="button" 
                      onClick={cancelEditing}
                      className="button-secondary"
                    >
                      <X size={16} />
                      Cancel
                    </button>
                    <button type="submit" className="button-primary">
                      <Save size={16} />
                      Save
                    </button>
                  </div>
                </form>
              ) : (
                <React.Fragment key={`category-view-${category.id}`}>
                  <div className="user-info-header" style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'flex-start'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ 
                        width: '2.5rem', 
                        height: '2.5rem', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        backgroundColor: '#e0f2fe',
                        color: '#0369a1',
                        borderRadius: '0.5rem'
                      }}>
                        <Folder size={18} />
                      </div>
                      <h3 className="user-header-name" style={{ margin: '0' }}>{category.name}</h3>
                    </div>
                    
                    <div className="table-actions">
                      <button 
                        onClick={() => startEditing(category)}
                        className="action-button action-edit"
                        title="Edit Category"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(category.id)}
                        className="action-button action-deactivate"
                        title="Delete Category"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <div style={{ padding: '1rem 1.5rem' }}>
                    <p style={{ 
                      color: '#6b7280',
                      fontSize: '0.875rem',
                      margin: '0 0 1rem 0'
                    }}>
                      {category.description || 'No description provided'}
                    </p>
                    
                    {category.jobCount !== undefined && (
                      <div key={`job-count-${category.id}`} className="status-indicator status-active" style={{ display: 'inline-flex' }}>
                        {category.jobCount} {category.jobCount === 1 ? 'job' : 'jobs'} in this category
                      </div>
                    )}
                  </div>
                </React.Fragment>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default JobCategories;