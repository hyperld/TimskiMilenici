import React from 'react';
import RegisterForm from './components/RegisterForm/RegisterForm';

const RegisterScreen: React.FC = () => {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh' 
    }}>
      <RegisterForm />
    </div>
  );
};

export default RegisterScreen;
