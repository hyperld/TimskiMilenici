import React from 'react';
import styles from './BusinessList.module.css';
import Button from '../../../../shared/components/Button/Button';

interface BusinessListProps {
  loading: boolean;
  stores: any[];
  onEditStore: (store: any) => void;
  onAddStore: () => void;
}

const BusinessList: React.FC<BusinessListProps> = ({ loading, stores, onEditStore, onAddStore }) => {
  if (loading) {
    return <div className={styles.loading}>Loading stores...</div>;
  }

  if (stores.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>🏬</div>
        <h3>No stores found</h3>
        <p>You haven't added any businesses yet.</p>
        <Button onClick={onAddStore}>Create Your First Store</Button>
      </div>
    );
  }

  return (
    <div className={styles.businessGrid}>
      {stores.map(store => (
        <div key={store.id} className={styles.businessCard}>
          <div className={styles.cardImage}>
            {store.mainImageUrl ? (
              <img src={store.mainImageUrl} alt={store.name} />
            ) : (
              <div className={styles.imagePlaceholder}>🏬</div>
            )}
          </div>
          <div className={styles.cardContent}>
            <h3>{store.name}</h3>
            <p className={styles.typeBadge}>{store.type}</p>
            <p className={styles.address}>{store.address}</p>
            <div className={styles.cardActions}>
              <Button 
                onClick={() => onEditStore(store)}
                fullWidth
              >
                Manage Store
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default BusinessList;
