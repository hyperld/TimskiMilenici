import React from 'react';
import styles from './DashboardHeader.module.css';
import Button from '../../../../shared/components/Button/Button';

interface DashboardHeaderProps {
  title: string;
  description: string;
  onAddClick: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ title, description, onAddClick }) => {
  return (
    <header className={styles.dashboardHeader}>
      <div className={styles.titleSection}>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <Button onClick={onAddClick}>
        + Add New Store
      </Button>
    </header>
  );
};

export default DashboardHeader;
