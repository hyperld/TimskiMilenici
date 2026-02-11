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
          {(userData.profilePictureUrl ?? userData.profileImageUrl) ? (
            <img src={userData.profilePictureUrl ?? userData.profileImageUrl} alt={userData.fullName} />
          ) : (
            '👤'
          )}
        </div>
        <h2>{userData.fullName}</h2>
        <div className={styles.roleBadge}>{userData.role}</div>
      </div>

      <div className={styles.editProfileBtnWrap}>
        <Button fullWidth onClick={onEdit}>
          ⚙️ Edit Profile
        </Button>
      </div>
    </div>
  );
};

export default AccountCard;
