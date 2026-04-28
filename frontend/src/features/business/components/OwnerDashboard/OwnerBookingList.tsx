import React from 'react';
import { parseBookingDateTime } from '../../../booking/services/bookingService';
import Button from '../../../../shared/components/Button/Button';
import styles from './OwnerItemGrid.module.css';

interface OwnerBookingListProps {
  bookings: any[];
  loading: boolean;
  onViewDetails: (booking: any) => void;
  onDismiss?: (booking: any) => void;
  onComplete?: (booking: any) => void;
}

const OwnerBookingList: React.FC<OwnerBookingListProps> = ({
  bookings,
  loading,
  onViewDetails,
  onDismiss,
  onComplete,
}) => {
  if (loading) {
    return <div className={styles.loading}>Loading bookings...</div>;
  }

  if (bookings.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>📅</div>
        <h3>No bookings found</h3>
        <p>There are no bookings across your stores yet.</p>
      </div>
    );
  }

  const statusClass = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'CONFIRMED': return styles.statusConfirmed;
      case 'CANCELLED': return styles.statusCancelled;
      case 'COMPLETED': return styles.statusCompleted;
      default: return styles.statusPending;
    }
  };

  const isTerminal = (status: string) => {
    const s = status?.toUpperCase();
    return s === 'CANCELLED' || s === 'COMPLETED';
  };

  return (
    <div className={styles.itemGrid}>
      {bookings.map((b) => {
        const parsed = parseBookingDateTime(b.bookingTime);
        const customerName = b.user?.fullName || b.user?.username || 'Guest';
        const serviceName = b.service?.name || 'Unknown service';
        const storeName = b.storeName || b.business?.name || '';
        const terminal = isTerminal(b.status);

        return (
          <div key={b.id} className={styles.itemCard}>
            <div className={styles.cardIcon}>📅</div>
            <div className={styles.cardBody}>
              <div className={styles.cardTopRow}>
                <h4 className={styles.cardName}>{serviceName}</h4>
                {storeName && <span className={styles.storeBadge}>{storeName}</span>}
              </div>
              <div className={styles.cardMeta}>
                <span className={styles.meta}>{customerName}</span>
                {parsed && (
                  <span className={styles.meta}>{parsed.dateStr} {parsed.timeStr}</span>
                )}
                <span className={`${styles.statusBadge} ${statusClass(b.status)}`}>
                  {b.status || 'PENDING'}
                </span>
              </div>
            </div>
            <div className={styles.cardActions}>
              {!terminal && onComplete && (
                <button
                  type="button"
                  className={styles.iconBtn}
                  onClick={() => onComplete(b)}
                  title="Mark as completed"
                >✅</button>
              )}
              {!terminal && onDismiss && (
                <button
                  type="button"
                  className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                  onClick={() => onDismiss(b)}
                  title="Dismiss booking"
                >❌</button>
              )}
              <Button size="sm" variant="outline" onClick={() => onViewDetails(b)}>Details</Button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OwnerBookingList;
