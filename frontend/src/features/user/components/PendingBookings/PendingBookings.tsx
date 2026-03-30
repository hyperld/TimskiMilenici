import React, { useEffect, useState } from 'react';
import { bookingService, parseBookingDateTime } from '../../../booking/services/bookingService';
import styles from './PendingBookings.module.css';

interface PendingBookingsProps {
  userId: number;
  compact?: boolean;
}

const PendingBookings: React.FC<PendingBookingsProps> = ({ userId, compact }) => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    bookingService.getBookingsByUser(userId).then((data) => {
      if (cancelled) return;
      const pending = (data || []).filter(
        (b: any) => b.status !== 'CANCELLED' && b.status !== 'COMPLETED'
      );
      setBookings(pending);
    }).catch(() => { if (!cancelled) setError('Failed to load bookings'); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [userId]);

  const handleCancel = async (bookingId: number) => {
    setError(null);
    setCancellingId(bookingId);
    try {
      await bookingService.updateBookingStatus(bookingId, 'CANCELLED');
      setBookings((prev) => prev.filter((b: any) => b.id !== bookingId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to cancel booking');
    } finally {
      setCancellingId(null);
    }
  };

  const rootClass = compact ? `${styles.card} ${styles.cardCompact}` : styles.card;

  if (loading) {
    return (
      <div className={rootClass}>
        <h3 className={styles.title}>My pending bookings</h3>
        <p className={styles.text}>Loading…</p>
      </div>
    );
  }

  return (
    <div className={rootClass}>
      <h3 className={styles.title}>My pending bookings</h3>
      {error && <p className={styles.error}>{error}</p>}
      {bookings.length === 0 ? (
        <p className={styles.text}>No pending bookings.</p>
      ) : compact ? (
        <ul className={styles.compactList}>
          {bookings.map((b: any) => {
            const parsed = parseBookingDateTime(b.bookingTime);
            const dateStr = parsed?.dateStr ?? '—';
            const timeStr = parsed?.timeStr ?? '—';
            const serviceName = b.service?.name || 'Service';
            const isCancelling = cancellingId === b.id;
            return (
              <li key={b.id} className={styles.compactItem}>
                <div className={styles.compactTop}>
                  <span className={styles.compactService}>{serviceName}</span>
                  <span className={styles.status}>{b.status}</span>
                </div>
                <div className={styles.compactMeta}>
                  <span className={styles.compactWhen}>
                    {dateStr} · {timeStr}
                  </span>
                  <button
                    type="button"
                    className={styles.cancelBtn}
                    onClick={() => handleCancel(b.id)}
                    disabled={isCancelling}
                    aria-label="Cancel booking"
                  >
                    {isCancelling ? '…' : 'Cancel'}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className={styles.scrollBody}>
          <div className={styles.headerRow}>
            <span className={styles.headerCell}>Date</span>
            <span className={styles.headerCell}>Time</span>
            <span className={styles.headerCell}>Service</span>
            <span className={styles.headerCell}>Status</span>
            <span className={styles.headerCell} aria-hidden>
              Actions
            </span>
          </div>
          <ul className={styles.list}>
            {bookings.map((b: any) => {
              const parsed = parseBookingDateTime(b.bookingTime);
              const dateStr = parsed?.dateStr ?? '—';
              const timeStr = parsed?.timeStr ?? '—';
              const serviceName = b.service?.name || 'Service';
              const isCancelling = cancellingId === b.id;
              return (
                <li key={b.id} className={styles.item}>
                  <span className={styles.date}>{dateStr}</span>
                  <span className={styles.time}>{timeStr}</span>
                  <span className={styles.service}>{serviceName}</span>
                  <span className={styles.status}>{b.status}</span>
                  <button
                    type="button"
                    className={styles.cancelBtn}
                    onClick={() => handleCancel(b.id)}
                    disabled={isCancelling}
                    aria-label="Cancel booking"
                  >
                    {isCancelling ? 'Cancelling…' : 'Cancel'}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PendingBookings;
