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

  const scrollAreaStyle: React.CSSProperties = {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem 1rem',
    backgroundColor: 'transparent',
    color: 'var(--color-text)',
  };

  return (
    <div className="appRouteRoot">
      <div style={scrollAreaStyle}>
        <WelcomeHeader />
        <AuthCard />
      </div>
    </div>
  );
};

export default WelcomeScreen;
