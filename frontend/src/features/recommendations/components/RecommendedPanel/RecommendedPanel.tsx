import React from 'react';
import styles from './RecommendedPanel.module.css';

export interface RecommendedItem {
  title: string;
  subtitle: string;
  onClick: () => void;
}

interface RecommendedPanelProps {
  items: RecommendedItem[];
}

const RecommendedPanel: React.FC<RecommendedPanelProps> = ({ items }) => {
  return (
    <section className={styles.panel}>
      <h3 className={styles.title}>Recommended</h3>
      <div className={styles.grid}>
        {items.slice(0, 4).map((item) => (
          <button
            key={item.title}
            type="button"
            className={styles.item}
            onClick={item.onClick}
          >
            <span className={styles.itemTitle}>{item.title}</span>
            <span className={styles.itemText}>{item.subtitle}</span>
          </button>
        ))}
      </div>
    </section>
  );
};

export default RecommendedPanel;

