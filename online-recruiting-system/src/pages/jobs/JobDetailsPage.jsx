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
        // In a real application, you would fetch from your API
        // const response = await api.get(`/jobs/${id}`);
        // setJob(response.data);
        
        // Mock data for demonstration
        setTimeout(() => {
          setJob({
            _id: id,
            title: 'Senior Frontend Developer',
            companyName: 'Tech Innovations Inc.',
            location: 'Vancouver, BC',
            positionType: 'Full Time',
            categoryName: 'Information Technology',
            salary: 110000,
            description: 'We are seeking an experienced Frontend Developer to join our team. You will be responsible for building user interfaces using React.js and modern web technologies.\n\nYou will work closely with designers, backend developers, and product managers to create engaging and responsive web applications.',
            postDate: new Date('2025-02-01'),
            dueDate: new Date('2025-03-15'),
            contactEmail: 'careers@techinnovations.com',
            minEducationLevel: 'Bachelor\'s Degree',
            minExperience: 4,
            responsibilities: [
              'Develop and maintain responsive web applications using React and modern JavaScript',
              'Collaborate with UX/UI designers to implement intuitive user interfaces',
              'Optimize applications for maximum speed and scalability',
              'Ensure cross-browser compatibility and responsive design',
              'Write clean, maintainable, and well-documented code'
            ],
            requirements: [
              'Bachelor\'s degree in Computer Science or related field',
              'At least 4 years of experience in frontend development',
              'Proficiency in JavaScript, React.js, HTML5, and CSS3',
              'Experience with state management libraries (Redux, MobX, etc.)',
              'Understanding of responsive design principles',
              'Knowledge of modern frontend build tools and workflows',
              'Excellent problem-solving and communication skills'
            ]
          });
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching job details:', error);
        setError('Failed to load job details. Please try again later.');
        setLoading(false);
      }
    };

    fetchJob();
  }, [id]);

  const handleApply = async (jobId) => {
    try {
      setApplyLoading(true);
      // In a real application, you would submit to your API
      // await api.post('/applications', { jobId });
      
      // Mock submission for demonstration
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      alert('Application submitted successfully!');
      setApplyLoading(false);
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Failed to submit application. Please try again.');
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