import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import HRDashboard from '../../components/hr/HRDashboard';

const Dashboard = () => {
  const { user } = useAuth();
  
  return (
    <div className="page-container">
      <HRDashboard user={user} />
    </div>
  );
};

export default Dashboard;