import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import JobDetail from '../../components/job/JobDetail';
import api from '../../services/api';

const JobDetailsPage = () => {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applyLoading, setApplyLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/jobs/${id}`);
        
        // Format dates properly and ensure all required fields exist
        const jobData = {
          ...response.data,
          // Ensure dates are properly formatted
          postDate: response.data.post_date || response.data.postDate,
          dueDate: response.data.due_date || response.data.dueDate,
          // Ensure education and experience fields exist
          minEducationLevel: response.data.min_education_level || response.data.minEducationLevel || "Not specified",
          minExperience: response.data.min_experience || response.data.minExperience || 0
        };
        
        console.log("Job data retrieved:", jobData);
        setJob(jobData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching job details:', error);
        setError('Failed to load job details. Please try again later.');
        setLoading(false);
      }
    };

    fetchJob();
  }, [id]);

  const handleApply = async (jobId) => {
    // First, make sure we have a valid job ID
    if (!jobId || jobId === 'undefined') {
      alert('Invalid job ID. Cannot submit application.');
      return;
    }
  
    try {
      setApplyLoading(true);
      // Use the job ID from the current job object, not the parameter
      // This ensures we're using the correct ID even if the parameter is wrong
      const actualJobId = job.id || job._id;
      
      console.log('Submitting application for job ID:', actualJobId);
      
      await api.post(`/jobs/apply/${actualJobId}`, {
        // You can add cover letter or resume path here if needed
        coverLetter: '',
        resumePath: ''
      });
      
      alert('Application submitted successfully!');
      setApplyLoading(false);
    } catch (error) {
      console.error('Error submitting application:', error);
      const errorMessage = error.response?.data?.message || 'Failed to submit application. Please try again.';
      alert(errorMessage);
      setApplyLoading(false);
    }
  };

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="page-container">
      <JobDetail 
        job={job} 
        loading={loading || applyLoading}
        onApply={handleApply}
      />
    </div>
  );
};

export default JobDetailsPage;