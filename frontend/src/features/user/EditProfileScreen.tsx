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

  const isOwner = user.role === 'OWNER' || user.role === 'BUSINESS_OWNER';
  const backLabel = isOwner ? '← Back to Dashboard' : '← Back to Home';
  const backPath = isOwner ? '/owner-dashboard' : '/home';

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
            onClick={() => navigate(backPath)}
            style={{
              marginBottom: '1.5rem',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              color: 'var(--color-text)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-sm)',
              padding: '0.5rem 1rem',
            }}
          >
            {backLabel}
          </Button>
          <EditProfileForm />
        </div>
      </main>
    </div>
  );
};

export default EditProfileScreen;
