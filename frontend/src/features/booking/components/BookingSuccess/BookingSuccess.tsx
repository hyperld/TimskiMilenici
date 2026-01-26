import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './BookingSuccess.module.css';
import Button from '../../../../shared/components/Button/Button';

interface BookingSuccessProps {
  date: string;
  time: string;
}

const BookingSuccess: React.FC<BookingSuccessProps> = ({ date, time }) => {
  const navigate = useNavigate();

  return (
    <div className={styles.bookingSuccessContainer}>
      <div className={styles.successCard}>
        <div className={styles.successIcon}>✅</div>
        <h2>Booking Confirmed!</h2>
        <p>Your appointment has been successfully scheduled.</p>
        <p>Date: <strong>{date}</strong></p>
        <p>Time: <strong>{time}</strong></p>
        <Button onClick={() => navigate('/home')}>
          Back to Home
        </Button>
      </div>
    </div>
  );
};

export default BookingSuccess;
