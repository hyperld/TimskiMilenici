import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../../shared/components/TopBar/TopBar';
import { useAuth } from '../../features/auth/hooks/useAuth';
import InfoCard from './components/InfoCard/InfoCard';

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

  const contentStyle: React.CSSProperties = {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    display: 'flex',
    justifyContent: 'center',
    padding: '4rem 2rem',
  };

  return (
    <div className="appRouteRoot">
      <TopBar userName={user.fullName} />
      <main style={contentStyle}>
        <InfoCard userData={user} onEdit={() => navigate('/edit-profile')} />
      </main>
    </div>
  );
};

export default UserAccountScreen;
