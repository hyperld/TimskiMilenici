import React from 'react';
import { User } from '../../types';
import styles from './AccountCard.module.css';
import Button from '../../../../shared/components/Button/Button';

export interface AccountStat {
  icon: string;
  label: string;
  value: string | number;
}

interface AccountCardProps {
  userData: User;
  onEdit: () => void;
  greeting?: string;
  stats?: AccountStat[];
}

function getTimeGreeting(name: string): string {
  const h = new Date().getHours();
  if (h < 6) return `Burning the midnight oil, ${name}?`;
  if (h < 12) return `Good morning, ${name}`;
  if (h < 17) return `Good afternoon, ${name}`;
  if (h < 21) return `Good evening, ${name}`;
  return `Still going strong, ${name}?`;
}

function getTimeEmoji(): string {
  const h = new Date().getHours();
  if (h < 6) return '🌙';
  if (h < 12) return '☀️';
  if (h < 17) return '🌤️';
  if (h < 21) return '🌇';
  return '🌙';
}

const AccountCard: React.FC<AccountCardProps> = ({ userData, onEdit, greeting, stats }) => {
  const displayGreeting = greeting ?? getTimeGreeting(userData.fullName.split(' ')[0]);

  return (
    <div className={styles.accountCard}>
      <div className={styles.avatarWrap}>
        <div className={styles.avatar}>
          {(userData.profilePictureUrl ?? userData.profileImageUrl) ? (
            <img src={userData.profilePictureUrl ?? userData.profileImageUrl} alt={userData.fullName} />
          ) : (
            '👤'
          )}
        </div>
      </div>

      <div className={styles.identity}>
        <h2 className={styles.name}>{userData.fullName}</h2>
        <span className={styles.roleBadge}>{userData.role}</span>
      </div>

      <p className={styles.greeting}>
        <span className={styles.greetingEmoji}>{getTimeEmoji()}</span>
        {displayGreeting}
      </p>

      {stats && stats.length > 0 && (
        <div className={styles.statsGrid}>
          {stats.map((s, i) => (
            <div key={i} className={styles.statItem}>
              <span className={styles.statIcon}>{s.icon}</span>
              <div className={styles.statBody}>
                <span className={styles.statValue}>{s.value}</span>
                <span className={styles.statLabel}>{s.label}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={styles.editBtnWrap}>
        <Button size="sm" fullWidth onClick={onEdit}>
          Edit Profile
        </Button>
      </div>
    </div>
  );
};

export default AccountCard;
