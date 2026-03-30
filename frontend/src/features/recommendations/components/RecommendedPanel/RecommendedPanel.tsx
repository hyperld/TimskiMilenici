import React from 'react';
import styles from './RecommendedPanel.module.css';

export interface RecommendedItem {
  title: string;
  subtitle: string;
  onClick: () => void;
}

interface RecommendedPanelProps {
  items: RecommendedItem[];
  /** Narrow sidebar (home right column) vs full-width strip under listings */
  variant?: 'sidebar' | 'full';
}

const RecommendedPanel: React.FC<RecommendedPanelProps> = ({ items, variant = 'full' }) => {
  const panelClass =
    variant === 'sidebar' ? `${styles.panel} ${styles.panelSidebar}` : styles.panel;

  return (
    <section className={panelClass}>
      <h3 className={styles.title}>Recommended</h3>
      <div className={styles.listScroll}>
        <ul className={styles.list}>
          {items.slice(0, 4).map((item) => (
            <li key={item.title} className={styles.listItem}>
              <button type="button" className={styles.item} onClick={item.onClick}>
                <span className={styles.itemTitle}>{item.title}</span>
                <span className={styles.itemText}>{item.subtitle}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default RecommendedPanel;

