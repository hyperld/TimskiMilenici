import React from 'react';
import { User } from '../../types';
import styles from './AccountCard.module.css';
import Button from '../../../../shared/components/Button/Button';

interface AccountCardProps {
  userData: User;
  onEdit: () => void;
}

const AccountCard: React.FC<AccountCardProps> = ({ userData, onEdit }) => {
  return (
    <div className={styles.accountCard}>
      <div className={styles.accountHeader}>
        <div className={styles.avatar}>
          {userData.profileImageUrl ? (
            <img src={userData.profileImageUrl} alt={userData.fullName} />
          ) : (
            '👤'
          )}
        </div>
        <h2>{userData.fullName}</h2>
        <div className={styles.roleBadge}>{userData.role}</div>
      </div>

      <div className={styles.accountDetails}>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Email</span>
          <span className={styles.detailValue}>{userData.email}</span>
        </div>
        
        {userData.phoneNumber && (
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Phone</span>
            <span className={styles.detailValue}>{userData.phoneNumber}</span>
          </div>
        )}

        {userData.address && (
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Address</span>
            <span className={styles.detailValue}>{userData.address}</span>
          </div>
        )}
      </div>

      <Button fullWidth onClick={onEdit}>
        ⚙️ Edit Profile
      </Button>
    </div>
  );
};

export default AccountCard;
