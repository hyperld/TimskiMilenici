import React from 'react';
import type { InfoStat } from '../../../user/components/InfoCard/InfoCard';
import styles from './OwnerDashboardStatsBar.module.css';

interface OwnerDashboardStatsBarProps {
  stats: InfoStat[];
}

const OwnerDashboardStatsBar: React.FC<OwnerDashboardStatsBarProps> = ({ stats }) => {
  if (!stats.length) return null;
  return (
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
  );
};

export default OwnerDashboardStatsBar;
