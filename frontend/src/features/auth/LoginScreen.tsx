import React from 'react';
import LoginForm from './components/LoginForm/LoginForm';

const LoginScreen: React.FC = () => {
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
        <LoginForm />
      </div>
    </div>
  );
};

export default LoginScreen;
