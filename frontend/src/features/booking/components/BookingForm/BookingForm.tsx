import React from 'react';
import Calendar from '../Calendar/Calendar';
import styles from './BookingForm.module.css';
import Button from '../../../../shared/components/Button/Button';

interface BookingFormProps {
  date: string;
  time: string;
  notes: string;
  unavailableDates: string[];
  timeSlots: string[];
  error: string;
  loading: boolean;
  onDateSelect: (date: string) => void;
  onTimeSelect: (time: string) => void;
  onNotesChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const BookingForm: React.FC<BookingFormProps> = ({
  date,
  time,
  notes,
  unavailableDates,
  timeSlots,
  error,
  loading,
  onDateSelect,
  onTimeSelect,
  onNotesChange,
  onSubmit
}) => {
  return (
    <div className={styles.bookingFormSection}>
      <h2>Complete Your Booking</h2>
      <p className={styles.subtitle}>Select a date and time that works best for you.</p>

      {error && <div className={styles.errorBanner}>{error}</div>}

      <form className={styles.bookingForm} onSubmit={onSubmit}>
        <div className={styles.formGroup}>
          <label>1. Select Date</label>
          <Calendar 
            selectedDate={date} 
            onDateSelect={onDateSelect}
            unavailableDates={unavailableDates}
          />
        </div>

        {date && (
          <div className={styles.formGroup}>
            <label>2. Select Time</label>
            <div className={styles.timeSlotsGrid}>
              {timeSlots.map(t => (
                <Button
                  key={t}
                  type="button"
                  variant={time === t ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => onTimeSelect(t)}
                >
                  {t}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className={styles.formGroup}>
          <label htmlFor="notes">3. Additional Notes (Optional)</label>
          <textarea
            id="notes"
            name="notes"
            rows={4}
            placeholder="Any special requirements for your pet?"
            value={notes}
            onChange={onNotesChange}
          ></textarea>
        </div>

        <Button 
          type="submit" 
          fullWidth
          disabled={!date || !time || loading}
        >
          {loading ? 'Confirming...' : 'Confirm Booking'}
        </Button>
      </form>
    </div>
  );
};

export default BookingForm;
