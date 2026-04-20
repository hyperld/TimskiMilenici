import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Business } from '../../types';
import styles from './StoreCard.module.css';
import Button from '../../../../shared/components/Button/Button';

interface StoreCardProps {
  store: Business & { type?: string; types?: string[]; category?: string; distanceKm?: number };
}

function formatDistance(km: number): string {
  if (!isFinite(km) || km < 0) return '';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(km < 10 ? 1 : 0)} km`;
}

const StoreCard: React.FC<StoreCardProps> = ({ store }) => {
  const navigate = useNavigate();

  const allTypes: string[] =
    Array.isArray(store.types) && store.types.length > 0
      ? store.types
      : store.type
        ? [store.type]
        : (store as any).category
          ? [(store as any).category]
          : [];
  const typeLabel = allTypes.join(' / ');

  const maxDescriptionLength = 120;
  const description =
    store.description && store.description.length > maxDescriptionLength
      ? `${store.description.slice(0, maxDescriptionLength)}...`
      : store.description;

  return (
    <div className={styles.storeCard}>
      {typeof store.distanceKm === 'number' ? (
        <span
          className={styles.distanceBadge}
          aria-label={`${formatDistance(store.distanceKm)} away`}
        >
          {formatDistance(store.distanceKm)}
        </span>
      ) : null}
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
        <div className={styles.topRow}>
          <div className={styles.nameTypeWrap}>
            <h3 className={styles.storeName}>{store.name}</h3>
            {typeLabel && <span className={styles.storeType}>{typeLabel}</span>}
          </div>
          <div className={styles.locationWrap}>
            <span className={styles.storeLocation}>📍 {store.address}</span>
          </div>
        </div>
        <p className={styles.storeDescription}>{description}</p>
      </div>
      <div className={styles.actionCol}>
        <Button 
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/store/${store.id}`);
          }}
        >
          View
        </Button>
      </div>
    </div>
  );
};

export default StoreCard;
