import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import TopBar from '../../shared/components/TopBar/TopBar';
import { bookingService, buildBookedTimesByDate, buildFullDates } from './services/bookingService';
import { useAuth } from '../../features/auth/hooks/useAuth';
import BookingForm from './components/BookingForm/BookingForm';
import BookingSummary from './components/BookingSummary/BookingSummary';
import BookingSuccess from './components/BookingSuccess/BookingSuccess';

const TIME_SLOTS: string[] = (() => {
  const slots: string[] = [];
  for (let hour = 9; hour < 20; hour++) {
    for (const min of ['00', '30']) {
      slots.push(`${hour.toString().padStart(2, '0')}:${min}`);
    }
  }
  return slots;
})();

const BookingScreen: React.FC = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const serviceData = location.state?.service;
  const storeId = location.state?.storeId ?? location.state?.service?.businessId ?? location.state?.store?.id;

  const [bookingData, setBookingData] = useState({
    date: '',
    time: '',
    notes: ''
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unavailableDates, setUnavailableDates] = useState<string[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [error, setError] = useState('');

  const bookedTimesByDate = useMemo(() => buildBookedTimesByDate(bookings), [bookings]);
  const fullDatesFromBookings = useMemo(
    () => buildFullDates(bookedTimesByDate, TIME_SLOTS.length),
    [bookedTimesByDate]
  );
  const datesWithBookings = useMemo(() => Object.keys(bookedTimesByDate), [bookedTimesByDate]);

  useEffect(() => {
    if (storeId != null && (typeof storeId === 'number' || typeof storeId === 'string')) {
      const sid = typeof storeId === 'string' ? parseInt(storeId, 10) : storeId;
      if (isNaN(sid)) return;
      const start = new Date();
      const end = new Date();
      end.setDate(end.getDate() + 60);
      const startStr = start.toISOString().split('T')[0];
      const endStr = end.toISOString().split('T')[0];
      bookingService
        .getBookingsByStoreInRange(sid, startStr, endStr)
        .then((data) => setBookings(Array.isArray(data) ? data : []))
        .catch(() => setBookings([]));
    } else {
      if (!serviceId) return;
      bookingService.getFullDates(parseInt(serviceId)).then(setUnavailableDates).catch(() => setUnavailableDates([]));
    }
  }, [storeId, serviceId]);

  const effectiveUnavailableDates = useMemo(() => {
    if (storeId != null && (typeof storeId === 'number' || typeof storeId === 'string')) return fullDatesFromBookings;
    return unavailableDates;
  }, [storeId, fullDatesFromBookings, unavailableDates]);

  const reservedTimeSlots = useMemo(
    () => (bookingData.date ? (bookedTimesByDate[bookingData.date] || []) : []),
    [bookingData.date, bookedTimesByDate]
  );

  const handleDateSelect = (date: string) => {
    setBookingData(prev => ({ ...prev, date, time: '' }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBookingData(prev => ({ ...prev, [name]: value }));
  };

  const handleTimeSelect = (time: string) => {
    setBookingData(prev => ({ ...prev, time }));
  };

  const service = serviceData || {
    id: serviceId,
    name: 'Selected Service',
    price: '??.??',
    storeName: 'The Store'
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!serviceId) return;
      const result = await bookingService.createBooking({
        serviceId: parseInt(serviceId),
        ...bookingData
      });

      if (result.success) {
        setSubmitted(true);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while creating your booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const userName = user?.fullName || 'User';

  if (submitted) {
    return (
      <div>
        <TopBar userName={userName} />
        <BookingSuccess date={bookingData.date} time={bookingData.time} />
      </div>
    );
  }

  return (
    <div>
      <TopBar userName={userName} />
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1.5fr 1fr', 
          gap: '2rem', 
          marginTop: '1rem' 
        }}>
          <BookingForm 
            date={bookingData.date}
            time={bookingData.time}
            notes={bookingData.notes}
            unavailableDates={effectiveUnavailableDates}
            timeSlots={TIME_SLOTS}
            reservedTimeSlots={reservedTimeSlots}
            datesWithBookings={datesWithBookings}
            error={error}
            loading={loading}
            onDateSelect={handleDateSelect}
            onTimeSelect={handleTimeSelect}
            onNotesChange={handleInputChange}
            onSubmit={handleSubmit}
          />
          <BookingSummary service={service} />
        </div>
      </div>
    </div>
  );
};

export default BookingScreen;
