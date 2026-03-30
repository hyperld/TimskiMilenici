import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import styles from './TopBar.module.css';
import Button from '../Button/Button';

interface TopBarProps {
  userName?: string;
  profilePic?: string;
  beforeUserMenu?: React.ReactNode;
}

const TopBar: React.FC<TopBarProps> = ({
  userName = 'User',
  profilePic = '',
  beforeUserMenu,
}) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => setShowDropdown(!showDropdown);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleEditProfile = () => {
    navigate('/edit-profile');
    setShowDropdown(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const userRole = user?.role;
  const isOwner = userRole === 'OWNER' || userRole === 'BUSINESS_OWNER';
  const profilePicture = user?.profilePictureUrl ?? user?.profileImageUrl ?? profilePic;

  return (
    <nav className={styles.topBar}>
      <div className={styles.logoContainer} onClick={() => navigate('/home')}>
        <div className={styles.logoPlaceholder}>🐾</div>
        <h1>PetPal</h1>
      </div>
      <div className={styles.userNav}>
        {isOwner && (
          <Button 
            size="sm" 
            onClick={() => navigate('/owner-dashboard')}
            className={styles.ownerDashboardBtnNav}
          >
            Owner Dashboard
          </Button>
        )}
        <span>Welcome, {user?.fullName || userName}</span>
        {beforeUserMenu ? (
          <div className={styles.beforeUserMenu}>{beforeUserMenu}</div>
        ) : null}
        <div className={styles.userMenuContainer} ref={dropdownRef}>
          <div className={styles.userAvatar} onClick={toggleDropdown}>
            {profilePicture ? (
              <img src={profilePicture} alt="User Avatar" />
            ) : (
              <div className={styles.avatarPlaceholder}>👤</div>
            )}
          </div>
          
          {showDropdown && (
            <div className={styles.userDropdown}>
              <div className={styles.dropdownItem} onClick={handleEditProfile}>
                <span className={styles.dropdownIcon}>👤</span> Edit Profile
              </div>
              <div className={styles.dropdownDivider}></div>
              <div className={styles.dropdownItem} onClick={handleLogout}>
                <span className={`${styles.dropdownIcon} ${styles.logout}`}>🚪</span> 
                <span className={styles.logout}>Sign Out</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default TopBar;
