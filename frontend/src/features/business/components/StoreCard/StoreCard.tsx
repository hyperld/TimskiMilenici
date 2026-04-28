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

/** Render a 5-star bar with full / half / empty glyphs for the average rating. */
function renderStars(value: number): React.ReactNode[] {
  const stars: React.ReactNode[] = [];
  for (let i = 1; i <= 5; i += 1) {
    if (value >= i) {
      stars.push(<span key={i} className={styles.starFull}>★</span>);
    } else if (value >= i - 0.5) {
      stars.push(<span key={i} className={styles.starHalf}>★</span>);
    } else {
      stars.push(<span key={i} className={styles.starEmpty}>☆</span>);
    }
  }
  return stars;
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
            {typeof store.averageRating === 'number' && (store.reviewCount ?? 0) > 0 ? (
              <span
                className={styles.ratingWrap}
                aria-label={`${store.averageRating.toFixed(1)} out of 5 from ${store.reviewCount} review${store.reviewCount === 1 ? '' : 's'}`}
                title={`${store.averageRating.toFixed(1)} / 5 · ${store.reviewCount} review${store.reviewCount === 1 ? '' : 's'}`}
              >
                <span className={styles.ratingStars} aria-hidden>
                  {renderStars(store.averageRating)}
                </span>
                <span className={styles.ratingValue}>{store.averageRating.toFixed(1)}</span>
                <span className={styles.ratingCount}>({store.reviewCount})</span>
              </span>
            ) : (
              <span className={styles.ratingWrap} aria-label="No reviews yet">
                <span className={styles.ratingStars} aria-hidden>{renderStars(0)}</span>
                <span className={styles.ratingEmpty}>No reviews</span>
              </span>
            )}
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
