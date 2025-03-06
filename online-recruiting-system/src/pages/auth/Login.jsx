import React from 'react';
import LoginForm from '../../components/auth/LoginForm';

const Login = () => {
  return (
    <div className="page-container">
      <h1 className="page-title text-center">Login</h1>
      <LoginForm />
    </div>
  );
};

export default Login;