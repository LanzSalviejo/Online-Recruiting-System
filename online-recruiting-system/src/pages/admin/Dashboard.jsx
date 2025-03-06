import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AdminDashboard from '../../components/admin/AdminDashboard';

const Dashboard = () => {
  const { user } = useAuth();
  
  return (
    <div className="page-container">
      <AdminDashboard user={user} />
    </div>
  );
};

export default Dashboard;