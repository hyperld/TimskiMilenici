import React from 'react';
import styles from './BookingSummary.module.css';

interface BookingSummaryProps {
  service: {
    name: string;
    storeName: string;
    price: string;
  };
}

const BookingSummary: React.FC<BookingSummaryProps> = ({ service }) => {
  return (
    <div className={styles.serviceSummarySection}>
      <h3>Booking Summary</h3>
      <div className={styles.serviceSummaryCard}>
        <div className={styles.serviceIconLarge}>✂️</div>
        <div className={styles.summaryInfo}>
          <h4>{service.name}</h4>
          <p className={styles.serviceStore}>{service.storeName}</p>
          <p className={styles.servicePriceLarge}>${service.price}</p>
        </div>
        <div className={styles.summaryFooter}>
          <p>Status: <span className={styles.statusPending}>Pending Confirmation</span></p>
        </div>
      </div>

      <div className={styles.bookingInfoBox}>
        <h4>Important Information</h4>
        <ul>
          <li>Please arrive 5 minutes early.</li>
          <li>Cancellations must be made 24h in advance.</li>
          <li>Payment is handled at the store.</li>
        </ul>
      </div>
    </div>
  );
};

export default BookingSummary;
