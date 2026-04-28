import React from 'react';
import type { ProductWithStore } from '../../types';
import styles from './OwnerItemGrid.module.css';

interface OwnerProductListProps {
  products: ProductWithStore[];
  loading: boolean;
  onEdit: (product: ProductWithStore) => void;
  onDelete: (product: ProductWithStore) => void;
}

const OwnerProductList: React.FC<OwnerProductListProps> = ({ products, loading, onEdit, onDelete }) => {
  if (loading) {
    return <div className={styles.loading}>Loading products...</div>;
  }

  if (products.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>📦</div>
        <h3>No products found</h3>
        <p>Your stores don&apos;t have any products yet. Add products via the store&apos;s Manage screen.</p>
      </div>
    );
  }

  return (
    <div className={styles.itemGrid}>
      {products.map((p) => {
        const hasDiscount = p.onSale && p.currentPrice < p.originalPrice;
        return (
          <div key={`${p.businessId}-${p.id}`} className={styles.itemCard}>
            <div className={styles.cardIcon}>📦</div>
            <div className={styles.cardBody}>
              <div className={styles.cardTopRow}>
                <h4 className={styles.cardName}>{p.name}</h4>
                <span className={styles.storeBadge}>{p.businessName}</span>
              </div>
              <div className={styles.cardMeta}>
                <div className={styles.priceRow}>
                  <span className={styles.price}>${(hasDiscount ? p.currentPrice : p.originalPrice).toFixed(2)}</span>
                  {hasDiscount && <span className={styles.originalPrice}>${p.originalPrice.toFixed(2)}</span>}
                  {hasDiscount && <span className={styles.saleBadge}>SALE</span>}
                </div>
                {(p.stock != null || p.stockQuantity != null) && (
                  <span className={styles.meta}>Stock: {p.stockQuantity ?? p.stock}</span>
                )}
              </div>
              {p.description && (
                <p className={styles.description}>{p.description}</p>
              )}
            </div>
            <div className={styles.cardActions}>
              <button type="button" className={styles.iconBtn} onClick={() => onEdit(p)} title="Edit">✏️</button>
              <button type="button" className={`${styles.iconBtn} ${styles.iconBtnDanger}`} onClick={() => onDelete(p)} title="Delete">🗑️</button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OwnerProductList;
