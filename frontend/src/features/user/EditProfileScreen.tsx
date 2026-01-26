import React from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../../shared/components/TopBar/TopBar';
import { useAuth } from '../../features/auth/hooks/useAuth';
import EditProfileForm from './components/EditProfileForm/EditProfileForm';
import Button from '../../shared/components/Button/Button';

const EditProfileScreen: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

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
        <div style={{ width: '100%', maxWidth: '800px' }}>
          <Button 
            variant="ghost"
            size="sm"
            onClick={() => navigate('/account')}
            style={{ marginBottom: '1.5rem' }}
          >
            ← Back to Account
          </Button>
          <EditProfileForm />
        </div>
      </main>
    </div>
  );
};

export default EditProfileScreen;
