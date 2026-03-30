import React from 'react';
import styles from './AnalyticsPanelFrame.module.css';

interface AnalyticsPanelFrameProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

const AnalyticsPanelFrame: React.FC<AnalyticsPanelFrameProps> = ({ title, subtitle, children }) => {
  return (
    <section className={styles.panel} aria-label={title}>
      <header className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
      </header>
      <div className={styles.body}>{children}</div>
    </section>
  );
};

export default AnalyticsPanelFrame;
