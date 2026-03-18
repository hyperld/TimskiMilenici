import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ProductWithStore } from '../../types';
import Button from '../../../../shared/components/Button/Button';
import styles from './ProductCard.module.css';

interface ProductCardProps {
  product: ProductWithStore;
  onAddToCart?: (productId: number) => void;
  onViewDetails?: (product: ProductWithStore) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart, onViewDetails }) => {
  const navigate = useNavigate();

  const maxDescriptionLength = 80;
  const description =
    product.description && product.description.length > maxDescriptionLength
      ? `${product.description.slice(0, maxDescriptionLength)}...`
      : product.description;

  return (
    <div className={styles.card} onClick={() => onViewDetails?.(product)}>
      <div className={styles.imageArea}>
        <div className={styles.imagePlaceholder}>📦</div>
      </div>
      <div className={styles.info}>
        <span
          className={styles.storeName}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/store/${product.businessId}`);
          }}
        >
          {product.businessName}
        </span>
        <h3 className={styles.productName}>{product.name}</h3>
        {description && <p className={styles.description}>{description}</p>}
        <div className={styles.footer}>
          <span className={styles.price}>${Number(product.price).toFixed(2)}</span>
          {product.stockQuantity != null && product.stockQuantity > 0 && (
            <span className={styles.stock}>In Stock ({product.stockQuantity})</span>
          )}
        </div>
        {onAddToCart && (
          <Button
            size="sm"
            fullWidth
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product.id);
            }}
          >
            Add to Cart
          </Button>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
