import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import styles from './RegisterForm.module.css';
import Button from '../../../../shared/components/Button/Button';
import { businessService } from '../../../business/services/businessService';

const RegisterForm: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    role: 'user' as string,
    profilePictureUrl: '' as string,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [profilePictureUploading, setProfilePictureUploading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    e.target.value = '';
    setProfilePictureUploading(true);
    try {
      const { url } = await businessService.uploadImage(file);
      setFormData(prev => ({ ...prev, profilePictureUrl: url }));
    } catch (err) {
      console.error(err);
    } finally {
      setProfilePictureUploading(false);
    }
  };

  const handleRemoveProfilePicture = () => {
    setFormData(prev => ({ ...prev, profilePictureUrl: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await register(formData);
      navigate('/login', { state: { message: 'Registration successful! Please login.' } });
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.authForm} onSubmit={handleSubmit}>
      <h2>Register</h2>
      {error && <div className={styles.errorMessage}>{error}</div>}

      <div className={styles.formGroup}>
        <label>Profile picture (optional)</label>
        <div className={styles.profilePictureRow}>
          <div className={styles.profilePicturePreview}>
            {formData.profilePictureUrl ? (
              <img src={formData.profilePictureUrl} alt="Preview" className={styles.profilePictureImg} />
            ) : (
              <span className={styles.profilePicturePlaceholder}>👤</span>
            )}
          </div>
          <div className={styles.profilePictureActions}>
            <label className={styles.profilePictureLabel}>
              <input
                type="file"
                accept="image/*"
                onChange={handleProfilePictureChange}
                disabled={profilePictureUploading}
                className={styles.profilePictureInput}
              />
              <span className={styles.profilePictureBtn}>
                {profilePictureUploading ? 'Uploading…' : formData.profilePictureUrl ? 'Change' : 'Add photo'}
              </span>
            </label>
            {formData.profilePictureUrl && (
              <button type="button" onClick={handleRemoveProfilePicture} className={styles.profilePictureRemove}>
                Remove
              </button>
            )}
          </div>
        </div>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="fullName">Full Name</label>
        <input
          type="text"
          id="fullName"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          required
        />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="username">Username</label>
        <input
          type="text"
          id="username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          required
        />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="password">Password</label>
        <div className={styles.passwordInputWrapper}>
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
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
      <div className={`${styles.formGroup} ${styles.centerText}`}>
        <label>Register as:</label>
        <div className={styles.radioGroup}>
          <label>
            <input
              type="radio"
              name="role"
              value="user"
              checked={formData.role === 'user'}
              onChange={handleChange}
            />
            Regular User
          </label>
          <label>
            <input
              type="radio"
              name="role"
              value="owner"
              checked={formData.role === 'owner'}
              onChange={handleChange}
            />
            Owner
          </label>
        </div>
      </div>
      <Button type="submit" fullWidth disabled={loading}>
        {loading ? 'Registering...' : 'Register'}
      </Button>
      <p className={styles.authFooter}>
        Already have an account? <span onClick={() => navigate('/login')}>Login here</span>
      </p>
    </form>
  );
};

export default RegisterForm;
