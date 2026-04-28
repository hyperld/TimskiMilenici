import React from 'react';
import type { InfoStat } from '../../../user/components/InfoCard/InfoCard';
import styles from './OwnerDashboardStatsBar.module.css';

interface OwnerDashboardStatsBarProps {
  stats: InfoStat[];
  activeLabel?: string;
  onStatClick?: (label: string) => void;
}

const OwnerDashboardStatsBar: React.FC<OwnerDashboardStatsBarProps> = ({ stats, activeLabel, onStatClick }) => {
  if (!stats.length) return null;
  return (
    <div className={styles.statsGrid}>
      {stats.map((s, i) => (
        <button
          key={i}
          type="button"
          className={`${styles.statItem} ${activeLabel === s.label ? styles.statItemActive : ''}`}
          onClick={() => onStatClick?.(s.label)}
        >
          <span className={styles.statIcon}>{s.icon}</span>
          <div className={styles.statBody}>
            <span className={styles.statValue}>{s.value}</span>
            <span className={styles.statLabel}>{s.label}</span>
          </div>
        </button>
      ))}
    </div>
  );
};

export default OwnerDashboardStatsBar;
