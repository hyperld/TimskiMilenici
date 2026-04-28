import React from 'react';
import type { PetServiceWithStore } from '../../types';
import styles from './OwnerItemGrid.module.css';

interface OwnerServiceListProps {
  services: PetServiceWithStore[];
  loading: boolean;
  onEdit: (service: PetServiceWithStore) => void;
  onDelete: (service: PetServiceWithStore) => void;
}

const OwnerServiceList: React.FC<OwnerServiceListProps> = ({ services, loading, onEdit, onDelete }) => {
  if (loading) {
    return <div className={styles.loading}>Loading services...</div>;
  }

  if (services.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>🐾</div>
        <h3>No services found</h3>
        <p>Your stores don&apos;t have any services yet. Add services via the store&apos;s Manage screen.</p>
      </div>
    );
  }

  return (
    <div className={styles.itemGrid}>
      {services.map((svc) => {
        const hasDiscount = svc.onSale && svc.currentPrice < svc.originalPrice;
        const duration = svc.durationMinutes ?? svc.duration;
        return (
          <div key={`${svc.businessId}-${svc.id}`} className={styles.itemCard}>
            <div className={styles.cardIcon}>🐾</div>
            <div className={styles.cardBody}>
              <div className={styles.cardTopRow}>
                <h4 className={styles.cardName}>{svc.name}</h4>
                <span className={styles.storeBadge}>{svc.businessName}</span>
              </div>
              <div className={styles.cardMeta}>
                <div className={styles.priceRow}>
                  <span className={styles.price}>${(hasDiscount ? svc.currentPrice : svc.originalPrice).toFixed(2)}</span>
                  {hasDiscount && <span className={styles.originalPrice}>${svc.originalPrice.toFixed(2)}</span>}
                  {hasDiscount && <span className={styles.saleBadge}>SALE</span>}
                </div>
                {duration != null && (
                  <span className={styles.meta}>{duration} min</span>
                )}
              </div>
              {svc.description && (
                <p className={styles.description}>{svc.description}</p>
              )}
            </div>
            <div className={styles.cardActions}>
              <button type="button" className={styles.iconBtn} onClick={() => onEdit(svc)} title="Edit">✏️</button>
              <button type="button" className={`${styles.iconBtn} ${styles.iconBtnDanger}`} onClick={() => onDelete(svc)} title="Delete">🗑️</button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OwnerServiceList;
