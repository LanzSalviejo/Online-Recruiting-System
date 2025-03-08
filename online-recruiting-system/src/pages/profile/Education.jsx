import React, { useState, useEffect } from 'react';
import { getEducation, addEducation, updateEducation, deleteEducation } from '../../services/profileService';
import { toast } from 'react-toastify'; // For notifications

const Education = () => {
  const [educationData, setEducationData] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [currentEducation, setCurrentEducation] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    degreeLevel: '',
    fieldOfStudy: '',
    institution: '',
    startDate: '',
    endDate: '',
    gpa: ''
  });

  useEffect(() => {
    // Load education data on component mount
    const fetchEducation = async () => {
      try {
        const data = await getEducation();
        setEducationData(data);
      } catch (error) {
        toast.error('Failed to load education data');
      }
    };
    
    fetchEducation();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      let result;
      if (currentEducation) {
        // Update existing education
        result = await updateEducation(currentEducation.id, formData);
        setEducationData(prev => 
          prev.map(item => item.id === currentEducation.id ? result : item)
        );
        toast.success('Education updated successfully');
      } else {
        // Add new education
        result = await addEducation(formData);
        setEducationData(prev => [...prev, result]);
        toast.success('Education added successfully');
      }
      
      // Reset form and state
      setShowForm(false);
      setCurrentEducation(null);
      setFormData({
        degreeLevel: '',
        fieldOfStudy: '',
        institution: '',
        startDate: '',
        endDate: '',
        gpa: ''
      });
    } catch (error) {
      toast.error('Failed to save education data');
    }
  };

  const handleEdit = (education) => {
    setCurrentEducation(education);
    setFormData({
      degreeLevel: education.degreeLevel,
      fieldOfStudy: education.fieldOfStudy,
      institution: education.institution,
      startDate: education.startDate,
      endDate: education.endDate,
      gpa: education.gpa || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this education record?')) {
      try {
        await deleteEducation(id);
        setEducationData(prev => prev.filter(item => item.id !== id));
        toast.success('Education deleted successfully');
      } catch (error) {
        toast.error('Failed to delete education');
      }
    }
  };

  return (
    <section id="education" className="tab-content active">
      <h2>Education</h2>
      
      <div className="education-list">
        {educationData.length === 0 ? (
          <p>No education records found. Add your education details to improve job matching.</p>
        ) : (
          educationData.map(education => (
            <div key={education.id} className="list-item">
              <div className="list-item-header">
                <div>
                  <div className="list-item-title">
                    {education.degreeLevel} in {education.fieldOfStudy}
                  </div>
                  <div className="list-item-subtitle">{education.institution}</div>
                  <div className="list-item-dates">
                    {new Date(education.startDate).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short' 
                    })} - 
                    {new Date(education.endDate).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short' 
                    })}
                  </div>
                </div>
                <div className="list-item-actions">
                  <i 
                    className="fas fa-edit action-icon edit" 
                    onClick={() => handleEdit(education)}
                    title="Edit"
                  ></i>
                  <i 
                    className="fas fa-trash-alt action-icon delete" 
                    onClick={() => handleDelete(education.id)}
                    title="Delete"
                  ></i>
                </div>
              </div>
              {education.gpa && <div className="list-item-detail">GPA: {education.gpa}</div>}
            </div>
          ))
        )}
      </div>
      
      {!showForm ? (
        <button 
          className="btn btn-secondary"
          onClick={() => {
            setCurrentEducation(null);
            setFormData({
              degreeLevel: '',
              fieldOfStudy: '',
              institution: '',
              startDate: '',
              endDate: '',
              gpa: ''
            });
            setShowForm(true);
          }}
        >
          <i className="fas fa-plus"></i> Add Education
        </button>
      ) : (
        <div className="form-container">
          <form onSubmit={handleSubmit} className="profile-form">
            <h3>{currentEducation ? 'Edit Education' : 'Add Education'}</h3>

            <div className="form-group">
              <label htmlFor="degreeLevel">Degree Level</label>
              <select 
                id="degreeLevel" 
                name="degreeLevel" 
                value={formData.degreeLevel} 
                onChange={handleChange}
                required
              >
                <option value="">Select Degree Level</option>
                <option value="High School">High School</option>
                <option value="Diploma">Diploma</option>
                <option value="Associate">Associate Degree</option>
                <option value="Bachelor">Bachelor's Degree</option>
                <option value="Master">Master's Degree</option>
                <option value="Doctorate">Doctorate</option>
                <option value="Certificate">Certificate</option>
              </select>
            </div>

            {/* Additional form fields would go here */}
            
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                Save Education
              </button>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
};

export default Education;