import React from 'react';
import RegisterForm from '../../components/auth/RegisterForm';

const Register = () => {
  return (
    <div className="page-container">
      <h1 className="page-title text-center">Create an Account</h1>
      <RegisterForm />
    </div>
  );
};

export default Register;