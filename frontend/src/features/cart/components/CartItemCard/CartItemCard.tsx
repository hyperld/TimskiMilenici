import React, { useState } from 'react';
import type { CartItemResponse } from '../../services/cartService';
import Button from '../../../../shared/components/Button/Button';
import styles from './CartItemCard.module.css';

interface CartItemCardProps {
  item: CartItemResponse;
  onUpdateQuantity: (cartItemId: number, quantity: number) => Promise<void>;
  onRemove: (cartItemId: number) => void;
}

const CartItemCard: React.FC<CartItemCardProps> = ({ item, onUpdateQuantity, onRemove }) => {
  const [updating, setUpdating] = useState(false);
  const name = item.product?.name ?? 'Product';
  const price = item.product?.price ?? 0;
  const stock = item.product?.stockQuantity ?? null;
  const subtotal = price * item.quantity;
  const maxQty = stock != null ? Math.max(1, stock) : null;

  const handleChange = async (newQty: number) => {
    const qty = maxQty != null ? Math.min(newQty, maxQty) : newQty;
    if (qty < 1) return;
    setUpdating(true);
    try {
      await onUpdateQuantity(item.id, qty);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <article className={styles.card} role="listitem">
      <div className={styles.iconWrap} aria-hidden>
        <span className={styles.icon}>📦</span>
      </div>
      <div className={styles.body}>
        <h3 className={styles.name}>{name}</h3>
        <p className={styles.detail}>
          ${Number(price).toFixed(2)} ×{' '}
          <span className={styles.quantityRow}>
            <button
              type="button"
              className={styles.qtyBtn}
              onClick={() => handleChange(item.quantity - 1)}
              disabled={updating || item.quantity <= 1}
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className={styles.qtyValue}>{item.quantity}</span>
            <button
              type="button"
              className={styles.qtyBtn}
              onClick={() => handleChange(item.quantity + 1)}
              disabled={updating || (maxQty != null && item.quantity >= maxQty)}
              aria-label="Increase quantity"
            >
              +
            </button>
          </span>
        </p>
        <p className={styles.subtotal}>Subtotal: ${subtotal.toFixed(2)}</p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onRemove(item.id)}
        className={styles.removeBtn}
        aria-label="Remove from cart"
      >
        Remove
      </Button>
    </article>
  );
};

export default CartItemCard;
