import React, { useState } from 'react';
import { parseBookingDateTime } from '../../services/bookingService';
import Button from '../../../../shared/components/Button/Button';
import styles from './BookingInfo.module.css';

export interface BookingInfoProps {
  booking: {
    id?: number;
    bookingTime?: string | number[];
    status?: string;
    notes?: string | null;
    user?: { fullName?: string; username?: string; phoneNumber?: string; email?: string } | null;
    service?: { name?: string; durationMinutes?: number; price?: number } | null;
  };
  onClose?: () => void;
  /** When true, show a "Dismiss booking" button (owner-only). Calls onCancelBooking when clicked. */
  showCancelAction?: boolean;
  onCancelBooking?: (bookingId: number) => Promise<void>;
}

const BookingInfo: React.FC<BookingInfoProps> = ({ booking, onClose, showCancelAction, onCancelBooking }) => {
  const [dismissing, setDismissing] = useState(false);
  const [dismissError, setDismissError] = useState<string | null>(null);

  const canDismiss = showCancelAction && onCancelBooking && booking.id && booking.status !== 'CANCELLED';

  const handleDismiss = async () => {
    if (!booking.id || !onCancelBooking) return;
    setDismissError(null);
    setDismissing(true);
    try {
      await onCancelBooking(booking.id);
      onClose?.();
    } catch (err: any) {
      setDismissError(err.message || 'Failed to dismiss booking');
    } finally {
      setDismissing(false);
    }
  };
  const parsed = parseBookingDateTime(booking.bookingTime);
  const dateStr = parsed?.dateStr ?? '—';
  const timeStr = parsed?.timeStr ?? '—';
  const userName = booking.user?.fullName || booking.user?.username || 'Guest';
  const userPhone = booking.user?.phoneNumber;
  const userEmail = booking.user?.email;
  const serviceName = booking.service?.name || 'Service';
  const duration = booking.service?.durationMinutes;
  const price = booking.service?.price;
  const status = booking.status ?? '—';
  const notes = booking.notes?.trim() || null;

  return (
    <div className={styles.card}>      
      <dl className={styles.dl}>
        <dt>Date</dt>
        <dd>{dateStr}</dd>
        <dt>Time</dt>
        <dd>{timeStr}</dd>
        <dt>Status</dt>
        <dd>
          <span className={styles[`status_${(status || '').toLowerCase()}`] ?? styles.status}>
            {status}
          </span>
        </dd>
        <dt>Customer</dt>
        <dd>{userName}</dd>
        {userPhone && (
          <>
            <dt>Phone</dt>
            <dd>{userPhone}</dd>
          </>
        )}
        {userEmail && (
          <>
            <dt>Email</dt>
            <dd>{userEmail}</dd>
          </>
        )}
        <dt>Service</dt>
        <dd>
          {serviceName}
          {duration != null && ` · ${duration} min`}
          {price != null && ` · $${price}`}
        </dd>
        {notes && (
          <>
            <dt>Notes from customer</dt>
            <dd className={styles.notes}>{notes}</dd>
          </>
        )}
      </dl>
      {canDismiss && (
        <div className={styles.actions}>
          {dismissError && <p className={styles.dismissError}>{dismissError}</p>}
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={handleDismiss}
            disabled={dismissing}
          >
            {dismissing ? 'Dismissing…' : 'Dismiss booking'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default BookingInfo;
