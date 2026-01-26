import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Business } from '../../types';
import styles from './StoreCard.module.css';
import Button from '../../../../shared/components/Button/Button';

interface StoreCardProps {
  store: Business & { type?: string; location?: string };
}

const StoreCard: React.FC<StoreCardProps> = ({ store }) => {
  const navigate = useNavigate();

  return (
    <div className={styles.storeCard}>
      <div className={styles.storeImage}>
        {store.mainImageUrl ? (
          <img src={store.mainImageUrl} alt={store.name} />
        ) : store.images && store.images.length > 0 && store.images[0] ? (
          <img src={store.images[0]} alt={store.name} />
        ) : (
          <div className={styles.imagePlaceholder}>🏬</div>
        )}
      </div>
      <div className={styles.storeInfo}>
        <span className={styles.storeType}>{store.type}</span>
        <h3 className={styles.storeName}>{store.name}</h3>
        <p className={styles.storeDescription}>{store.description}</p>
        <div className={styles.storeFooter}>
          <span className={styles.storeLocation}>📍 {store.location || store.address}</span>
          <Button 
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/store/${store.id}`);
            }}
          >
            View Details
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StoreCard;
