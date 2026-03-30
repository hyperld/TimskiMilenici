import React from 'react';
import styles from './BusinessList.module.css';
import Button from '../../../../shared/components/Button/Button';

interface BusinessListProps {
  loading: boolean;
  stores: any[];
  onEditStore: (store: any) => void;
}

const BusinessList: React.FC<BusinessListProps> = ({ loading, stores, onEditStore }) => {
  if (loading) {
    return <div className={styles.loading}>Loading stores...</div>;
  }

  if (stores.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>🏬</div>
        <h3>No stores found</h3>
        <p>You haven&apos;t added any businesses yet. Use <strong>+ Add New Store</strong> above to create one.</p>
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
            <div className={styles.topRow}>
              <div>
                <h3>{store.name}</h3>
                <p className={styles.typeBadge}>{store.type}</p>
              </div>
              <p className={styles.address}>{store.address}</p>
            </div>
            <p className={styles.description}>
              {store.description && store.description.length > 140
                ? `${store.description.slice(0, 140)}...`
                : store.description || 'No description provided.'}
            </p>
          </div>
          <div className={styles.cardActions}>
            <Button 
              onClick={() => onEditStore(store)}
            >
              Manage
            </Button>
            </div>
        </div>
      ))}
    </div>
  );
};

export default BusinessList;
