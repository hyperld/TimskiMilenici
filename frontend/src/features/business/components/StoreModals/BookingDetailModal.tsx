import React from 'react';
import { parseBookingDateTime } from '../../../booking/services/bookingService';
import Button from '../../../../shared/components/Button/Button';
import styles from './Modal.module.css';

interface BookingDetailModalProps {
  booking: any;
  onClose: () => void;
}

const BookingDetailModal: React.FC<BookingDetailModalProps> = ({ booking, onClose }) => {
  if (!booking) return null;

  const parsed = parseBookingDateTime(booking.bookingTime);
  const customerName = booking.user?.fullName || booking.user?.username || 'Guest';
  const customerEmail = booking.user?.email || '—';
  const customerPhone = booking.user?.phoneNumber || booking.user?.phone || '—';
  const serviceName = booking.service?.name || 'Unknown service';
  const serviceDuration = booking.service?.durationMinutes ?? booking.service?.duration;
  const servicePrice = booking.service?.currentPrice ?? booking.service?.originalPrice;
  const storeName = booking.storeName || booking.business?.name || '—';
  const status = booking.status || 'PENDING';

  const statusColor = (() => {
    switch (status.toUpperCase()) {
      case 'CONFIRMED': return '#155724';
      case 'CANCELLED': return '#721c24';
      default: return '#856404';
    }
  })();

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} style={{ maxWidth: '460px' }} onClick={e => e.stopPropagation()}>
        <header className={styles.modalHeader}>
          <h2>Booking Details</h2>
          <Button variant="ghost" onClick={onClose} className={styles.closeBtn}>&times;</Button>
        </header>

        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Section title="Customer">
            <Row label="Name" value={customerName} />
            <Row label="Email" value={customerEmail} />
            <Row label="Phone" value={customerPhone} />
          </Section>

          <Section title="Service">
            <Row label="Service" value={serviceName} />
            {serviceDuration != null && <Row label="Duration" value={`${serviceDuration} min`} />}
            {servicePrice != null && <Row label="Price" value={`$${Number(servicePrice).toFixed(2)}`} />}
          </Section>

          <Section title="Appointment">
            <Row label="Store" value={storeName} />
            {parsed && (
              <>
                <Row label="Date" value={parsed.dateStr} />
                <Row label="Time" value={parsed.timeStr} />
              </>
            )}
            <Row label="Status" value={status} valueStyle={{ fontWeight: 700, color: statusColor }} />
          </Section>

          <div className={styles.formActions}>
            <Button variant="secondary" onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <h4 style={{ margin: '0 0 0.4rem', fontSize: '0.85rem', color: 'var(--color-primary)', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.3rem' }}>
      {title}
    </h4>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>{children}</div>
  </div>
);

const Row: React.FC<{ label: string; value: string; valueStyle?: React.CSSProperties }> = ({ label, value, valueStyle }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
    <span style={{ color: 'var(--color-text-light)' }}>{label}</span>
    <span style={{ fontWeight: 500, color: 'var(--color-text)', ...valueStyle }}>{value}</span>
  </div>
);

export default BookingDetailModal;
