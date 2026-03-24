import React, { useEffect, useMemo, useState } from 'react';
import styles from './SpecialOffersTab.module.css';

export interface SpecialOfferItem {
  id: number;
  type: 'product' | 'service';
  name: string;
  businessId: number;
  businessName: string;
  price: number;
  promotionPrice: number;
  promoted?: boolean;
}

interface SpecialOffersTabProps {
  items: SpecialOfferItem[];
  onRefresh: () => Promise<void> | void;
  onExploreOffer: (item: SpecialOfferItem) => void;
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

const SpecialOffersTab: React.FC<SpecialOffersTabProps> = ({ items, onRefresh, onExploreOffer }) => {
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

  if (visibleItems.length === 0) {
    return (
      <section className={styles.panel}>
        <div className={styles.header}>
          <h3 className={styles.title}>Special Offers</h3>
          <button type="button" className={styles.refreshBtn} onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        <p className={styles.empty}>No active offers right now. Check back soon.</p>
      </section>
    );
  }

  const item = visibleItems[activeIndex];
  const discountPercent = Math.max(0, Math.round(((item.price - item.promotionPrice) / item.price) * 100));

  return (
    <section className={styles.panel}>
      <div className={styles.header}>
        <h3 className={styles.title}>Special Offers</h3>
        <button type="button" className={styles.refreshBtn} onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <article
        className={styles.slide}
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
          <span className={styles.oldPrice}>${Number(item.price).toFixed(2)}</span>
          <span className={styles.newPrice}>${Number(item.promotionPrice).toFixed(2)}</span>
        </div>
      </article>

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
    </section>
  );
};

export default SpecialOffersTab;
