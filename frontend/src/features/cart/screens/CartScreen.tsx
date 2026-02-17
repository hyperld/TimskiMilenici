import React from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../../../shared/components/TopBar/TopBar';
import { useAuth } from '../../auth/hooks/useAuth';
import { useCart } from '../context/CartContext';
import { cartService } from '../services/cartService';
import CartItemCard from '../components/CartItemCard/CartItemCard';
import Button from '../../../shared/components/Button/Button';
import styles from './CartScreen.module.css';

const CartScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, itemCount, updateQuantity, removeItem, refreshCart } = useCart();
  const [checkoutLoading, setCheckoutLoading] = React.useState(false);
  const [checkoutError, setCheckoutError] = React.useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = React.useState(false);

  const handleCheckout = async () => {
    setCheckoutError(null);
    setCheckoutLoading(true);
    try {
      await cartService.checkout();
      await refreshCart();
      setShowSuccessModal(true);
    } catch (e: any) {
      setCheckoutError(e?.message ?? 'Checkout failed.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const needsProfileSetup = checkoutError && (
    /address|phone|profile/i.test(checkoutError)
  );

  if (!user) {
    navigate('/home');
    return null;
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <TopBar userName={user?.fullName || 'User'} />
      <main className={styles.main}>
        {itemCount === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🛒</div>
            <h1 className={styles.emptyTitle}>Cart</h1>
            <p className={styles.emptyText}>Your cart is empty.</p>
            <Button onClick={() => navigate('/home')}>
              Continue shopping
            </Button>
          </div>
        ) : (
          <div className={styles.wrapper}>
            <header className={styles.header}>
              <h1 className={styles.title}>Cart</h1>
              <span className={styles.count}>{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
            </header>
            <ul className={styles.list} role="list">
              {cart?.items?.map((item) => (
                <li key={item.id} className={styles.listItem}>
                  <CartItemCard item={item} onUpdateQuantity={updateQuantity} onRemove={removeItem} />
                </li>
              ))}
            </ul>
            <div className={styles.footer}>
              {checkoutError && (
                <p className={styles.checkoutError} role="alert">
                  {checkoutError}
                  {needsProfileSetup && (
                    <> <a href="/edit-profile" className={styles.profileLink} onClick={(e) => { e.preventDefault(); navigate('/edit-profile'); }}>Change it here</a></>
                  )}
                </p>
              )}
              <div className={styles.footerButtons}>
                <Button onClick={() => navigate('/home')}>
                  Continue shopping
                </Button>
                <Button
                  onClick={handleCheckout}
                  disabled={checkoutLoading}
                >
                  {checkoutLoading ? 'Processing…' : 'Continue to Checkout'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Success popout modal */}
      {showSuccessModal && (
        <div className={styles.modalOverlay} onClick={() => { setShowSuccessModal(false); navigate('/home'); }} role="dialog" aria-modal="true" aria-labelledby="order-success-title">
          <div className={styles.successModal} onClick={(e) => e.stopPropagation()}>
            <h2 id="order-success-title" className={styles.successTitle}>Order successfully confirmed</h2>
            <p className={styles.successText}>Your order has been placed. Thank you!</p>
            <Button onClick={() => { setShowSuccessModal(false); navigate('/home'); }}>
              Continue shopping
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartScreen;
