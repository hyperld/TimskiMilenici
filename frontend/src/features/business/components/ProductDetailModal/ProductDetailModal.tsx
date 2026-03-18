import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ProductWithStore } from '../../types';
import Button from '../../../../shared/components/Button/Button';
import styles from './ProductDetailModal.module.css';

interface ProductDetailModalProps {
  product: ProductWithStore;
  onClose: () => void;
  onAddToCart?: (productId: number) => void;
}

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product, onClose, onAddToCart }) => {
  const navigate = useNavigate();

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>&times;</button>
        <div className={styles.imageSection}>
          <div className={styles.imagePlaceholder}>📦</div>
        </div>
        <div className={styles.details}>
          <span
            className={styles.storeName}
            onClick={() => { onClose(); navigate(`/store/${product.businessId}`); }}
          >
            {product.businessName}
          </span>
          <h2 className={styles.productName}>{product.name}</h2>
          <p className={styles.description}>{product.description}</p>
          <div className={styles.meta}>
            <span className={styles.price}>${Number(product.price).toFixed(2)}</span>
            {product.stockQuantity != null && (
              <span className={product.stockQuantity > 0 ? styles.inStock : styles.outOfStock}>
                {product.stockQuantity > 0 ? `In Stock (${product.stockQuantity})` : 'Out of Stock'}
              </span>
            )}
          </div>
          <div className={styles.actions}>
            {onAddToCart && product.stockQuantity != null && product.stockQuantity > 0 && (
              <Button onClick={() => onAddToCart(product.id)}>Add to Cart</Button>
            )}
            <Button
              variant="outline"
              onClick={() => { onClose(); navigate(`/store/${product.businessId}`); }}
            >
              Visit Store
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailModal;
