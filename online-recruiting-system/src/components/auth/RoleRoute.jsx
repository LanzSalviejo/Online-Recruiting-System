import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const RoleRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();

  // Convert allowedRoles to array if it's a string
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  
  if (!user || !roles.includes(user.accountType)) {
    // Redirect to appropriate dashboard based on user role
    if (user) {
      switch (user.accountType) {
        case 'admin':
          return <Navigate to="/admin/dashboard" replace />;
        case 'hr':
          return <Navigate to="/hr/dashboard" replace />;
        case 'applicant':
          return <Navigate to="/dashboard" replace />;
        default:
          return <Navigate to="/" replace />;
      }
    }
    
    // This should not happen as PrivateRoute would catch it first
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default RoleRoute;