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
  const show = itemCount > 0 && !isHidden && !isOwner;

  if (!show) return null;

  return (
    <button
      type="button"
      className={styles.fab}
      onClick={() => navigate('/cart')}
      aria-label={`Cart with ${itemCount} item(s)`}
      title="View cart"
    >
      <span className={styles.icon} aria-hidden>🛒</span>
      <span className={styles.badge}>{itemCount > 99 ? '99+' : itemCount}</span>
    </button>
  );
};

export default CartIcon;
