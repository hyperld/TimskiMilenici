import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../../../features/cart/context/CartContext';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import styles from './CartIcon.module.css';

const HIDDEN_PATHS = ['/edit-profile', '/owner-dashboard'];

const CartIcon: React.FC = () => {
  const { itemCount } = useCart();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isHidden = HIDDEN_PATHS.some((p) => location.pathname.startsWith(p));
  const isOwner = user?.role === 'OWNER' || user?.role === 'BUSINESS_OWNER';

  const show = !isHidden && !isOwner && itemCount > 0;

  if (!show) return null;

  return (
    <button
      type="button"
      className={styles.stackBtn}
      onClick={() => navigate('/cart')}
      aria-label={itemCount > 0 ? `Cart with ${itemCount} item(s)` : 'Cart'}
      title="View cart"
    >
      <span className={styles.icon} aria-hidden>
        <svg viewBox="0 0 24 24" className={styles.iconSvg}>
          <path d="M3 4h2l2.2 9.2a1 1 0 0 0 1 .8h8.6a1 1 0 0 0 1-.76L20 7H7" />
          <circle cx="10" cy="19" r="1.5" />
          <circle cx="17" cy="19" r="1.5" />
        </svg>
      </span>
      {itemCount > 0 && (
        <span className={styles.badge}>{itemCount > 99 ? '99+' : itemCount}</span>
      )}
    </button>
  );
};

export default CartIcon;
