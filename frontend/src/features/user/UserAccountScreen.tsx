import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../../shared/components/TopBar/TopBar';
import { useAuth } from '../../features/auth/hooks/useAuth';
import AccountCard from './components/AccountCard/AccountCard';

const UserAccountScreen: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  if (!user) {
    return null;
  }

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
  };

  const contentStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    padding: '4rem 2rem',
  };

  return (
    <div style={containerStyle}>
      <TopBar userName={user.fullName} />
      <main style={contentStyle}>
        <AccountCard 
          userData={user} 
          onEdit={() => navigate('/edit-profile')} 
        />
      </main>
    </div>
  );
};

export default UserAccountScreen;
