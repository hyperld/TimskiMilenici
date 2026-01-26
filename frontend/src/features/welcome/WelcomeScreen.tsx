import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthCard from '../auth/components/AuthCard/AuthCard';
import { useAuth } from '../../features/auth/hooks/useAuth';
import WelcomeHeader from './components/WelcomeHeader/WelcomeHeader';

const WelcomeScreen: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      const userRole = user?.role;
      if (userRole === 'OWNER' || userRole === 'BUSINESS_OWNER') {
        navigate('/owner-dashboard');
      } else {
        navigate('/home');
      }
    }
  }, [isAuthenticated, user, navigate]);

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: 'transparent',
    color: 'var(--color-text)',
  };

  return (
    <div style={containerStyle}>
      <WelcomeHeader />
      <AuthCard />
    </div>
  );
};

export default WelcomeScreen;
