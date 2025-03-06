import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ApplicantDashboard from '../../components/applicant/ApplicantDashboard';

const Dashboard = () => {
  const { user } = useAuth();
  
  return (
    <div className="page-container">
      <ApplicantDashboard user={user} />
    </div>
  );
};

export default Dashboard;