import React from 'react';
import StoreCard from '../StoreCard/StoreCard';
import { Business } from '../../types';
import styles from './StoreGrid.module.css';

interface StoreGridProps {
  stores: Business[];
  loading: boolean;
  error: string;
}

const StoreGrid: React.FC<StoreGridProps> = ({ stores, loading, error }) => {
  return (
    <div className={styles.storeGrid}>
      {loading ? (
        <div className={styles.loadingContainer}>Loading stores...</div>
      ) : error ? (
        <div className={styles.errorMessage}>{error}</div>
      ) : stores.length > 0 ? (
        stores.map(store => (
          <StoreCard key={store.id} store={store as any} />
        ))
      ) : (
        <div className={styles.noResults}>No stores found matching your criteria.</div>
      )}
    </div>
  );
};

export default StoreGrid;
