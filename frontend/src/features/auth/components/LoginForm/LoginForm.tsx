import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import styles from './LoginForm.module.css';
import Button from '../../../../shared/components/Button/Button';

const LoginForm: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const successMessage = location.state?.message;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const userData = await login(identifier, password);
      
      const role = userData.role;
      if (role === 'OWNER' || role === 'BUSINESS_OWNER') {
        navigate('/owner-dashboard');
      } else {
        navigate('/home');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email, username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.authForm} onSubmit={handleSubmit}>
      <h2>Login</h2>
      {successMessage && <div className={styles.successMessage}>{successMessage}</div>}
      {error && <div className={styles.errorMessage}>{error}</div>}
      <div className={styles.formGroup}>
        <label htmlFor="identifier">Email or Username</label>
        <input
          type="text"
          id="identifier"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
        />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="password">Password</label>
        <div className={styles.passwordInputWrapper}>
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            className={styles.passwordToggleIcon}
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? "👁️" : "👁️‍🗨️"}
          </button>
        </div>
      </div>
      <Button type="submit" fullWidth disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </Button>
      <p className={styles.authFooter}>
        Don't have an account? <span onClick={() => navigate('/register')}>Register here</span>
      </p>
    </form>
  );
};

export default LoginForm;
