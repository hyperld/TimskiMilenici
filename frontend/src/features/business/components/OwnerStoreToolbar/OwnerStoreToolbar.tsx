import React from 'react';
import styles from './OwnerStoreToolbar.module.css';

interface OwnerStoreToolbarProps {
  onAddStore: () => void;
  pagination?: React.ReactNode;
}

const OwnerStoreToolbar: React.FC<OwnerStoreToolbarProps> = ({ onAddStore, pagination }) => {
  return (
    <div className={styles.toolbar}>
      <div className={styles.addSlot}>
        <button type="button" className={styles.addStoreBtn} onClick={onAddStore}>
          + Add New Store
        </button>
      </div>
      {pagination ? <div className={styles.paginationSlot}>{pagination}</div> : null}
    </div>
  );
};

export default OwnerStoreToolbar;
