import React, { useEffect, useMemo, useState } from 'react';
import styles from './SpecialOffersTab.module.css';

export interface SpecialOfferItem {
  id: number;
  type: 'product' | 'service';
  name: string;
  businessId: number;
  businessName: string;
  /** Regular (non-discounted) price. */
  originalPrice: number;
  /** Discounted price applied while the offer is active. */
  currentPrice: number;
  promoted?: boolean;
}

interface SpecialOffersTabProps {
  items: SpecialOfferItem[];
  onRefresh: () => Promise<void> | void;
  onExploreOffer: (item: SpecialOfferItem) => void;
  onViewAll?: () => void;
}

const AUTO_SLIDE_MS = 4500;

const shuffle = <T,>(arr: T[]): T[] => {
  const clone = [...arr];
  for (let i = clone.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [clone[i], clone[j]] = [clone[j], clone[i]];
  }
  return clone;
};

const SpecialOffersTab: React.FC<SpecialOffersTabProps> = ({ items, onRefresh, onExploreOffer, onViewAll }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const visibleItems = useMemo(() => shuffle(items).slice(0, 8), [items]);

  useEffect(() => {
    setActiveIndex(0);
  }, [visibleItems.length]);

  useEffect(() => {
    if (visibleItems.length <= 1) return undefined;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % visibleItems.length);
    }, AUTO_SLIDE_MS);
    return () => clearInterval(timer);
  }, [visibleItems.length]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  const hasOffers = visibleItems.length > 0;
  const item = hasOffers ? visibleItems[activeIndex] : null;
  const discountPercent =
    item && item.originalPrice > 0
      ? Math.max(0, Math.round(((item.originalPrice - item.currentPrice) / item.originalPrice) * 100))
      : 0;

  return (
    <section className={styles.panel}>
      <div className={styles.header}>
        <h3 className={styles.title}>Special Offers</h3>
        <div className={styles.headerActions}>
          <button type="button" className={styles.refreshBtn} onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          {onViewAll && (
            <button type="button" className={styles.viewAllBtn} onClick={onViewAll}>
              View all
            </button>
          )}
        </div>
      </div>

      <div className={styles.bodySlot}>
        {!hasOffers ? (
          <p className={styles.empty}>No active offers right now. Check back soon.</p>
        ) : item ? (
          <div className={styles.slideViewport}>
            <article
              key={`${item.type}-${item.id}-${activeIndex}`}
              className={`${styles.slide} ${styles.slideEnter}`}
              onClick={() => onExploreOffer(item)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onExploreOffer(item);
              }}
            >
              <div className={styles.slideTop}>
                <span className={styles.offerType}>{item.type === 'product' ? 'Product' : 'Service'}</span>
                <span className={styles.discount}>{discountPercent}% off</span>
              </div>
              <h4 className={styles.offerName}>{item.name}</h4>
              <p className={styles.storeName}>{item.businessName}</p>
              <div className={styles.priceRow}>
                <span className={styles.oldPrice}>${Number(item.originalPrice).toFixed(2)}</span>
                <span className={styles.newPrice}>${Number(item.currentPrice).toFixed(2)}</span>
              </div>
            </article>
          </div>
        ) : null}
      </div>

      {hasOffers && (
        <div className={styles.dots}>
          {visibleItems.map((_, idx) => (
            <button
              key={`offer-dot-${idx}`}
              type="button"
              className={`${styles.dot} ${idx === activeIndex ? styles.dotActive : ''}`}
              onClick={() => setActiveIndex(idx)}
              aria-label={`Show offer ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default SpecialOffersTab;
