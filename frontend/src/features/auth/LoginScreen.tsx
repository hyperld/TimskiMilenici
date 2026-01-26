import React from 'react';
import LoginForm from './components/LoginForm/LoginForm';

const LoginScreen: React.FC = () => {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh' 
    }}>
      <LoginForm />
    </div>
  );
};

export default LoginScreen;
