import React from 'react';
import styles from './NotificationTab.module.css';

const NotificationTab: React.FC = () => {
  return (
    <div className={styles.placeholder}>
      <div className={styles.icon}>🔔</div>
      <h3 className={styles.title}>Notifications</h3>
      <p className={styles.text}>
        Notifications and alerts will appear here.
      </p>
    </div>
  );
};

export default NotificationTab;
