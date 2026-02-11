import React from 'react';
import styles from './AnalyticsPlaceholder.module.css';

const AnalyticsPlaceholder: React.FC = () => {
  return (
    <div className={styles.placeholder}>
      <div className={styles.icon}>📊</div>
      <h3 className={styles.title}>Analytics</h3>
      <p className={styles.text}>
        Analytical information, charts, or insights will appear here.
      </p>
    </div>
  );
};

export default AnalyticsPlaceholder;
