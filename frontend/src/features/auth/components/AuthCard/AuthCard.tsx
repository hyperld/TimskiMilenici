import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './AuthCard.module.css';
import Button from '../../../../shared/components/Button/Button';

const AuthCard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.authCard}>
      <h2>Welcome to PetPal</h2>
      <div className={styles.buttonGroup}>
        <Button onClick={() => navigate('/login')} fullWidth>Login</Button>
        <Button variant="secondary" onClick={() => navigate('/register')} fullWidth>Register</Button>
      </div>
      <div className={styles.guestOption}>
        <span className={styles.guestLink} onClick={() => navigate('/home')}>Continue as Guest</span>
      </div>
    </div>
  );
};

export default AuthCard;
