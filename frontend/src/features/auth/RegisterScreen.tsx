import React from 'react';
import RegisterForm from './components/RegisterForm/RegisterForm';

const RegisterScreen: React.FC = () => {
  return (
    <div className="appRouteRoot">
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '2rem 1rem',
        }}
      >
        <RegisterForm />
      </div>
    </div>
  );
};

export default RegisterScreen;
