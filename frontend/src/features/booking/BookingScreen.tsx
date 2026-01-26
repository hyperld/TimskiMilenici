import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import TopBar from '../../shared/components/TopBar/TopBar';
import { bookingService } from './services/bookingService';
import { useAuth } from '../../features/auth/hooks/useAuth';
import BookingForm from './components/BookingForm/BookingForm';
import BookingSummary from './components/BookingSummary/BookingSummary';
import BookingSuccess from './components/BookingSuccess/BookingSuccess';

const BookingScreen: React.FC = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const serviceData = location.state?.service;

  const [bookingData, setBookingData] = useState({
    date: '',
    time: '',
    notes: ''
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unavailableDates, setUnavailableDates] = useState<string[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        if (!serviceId) return;
        const fullDates = await bookingService.getFullDates(parseInt(serviceId));
        setUnavailableDates(fullDates);
      } catch (err) {
        console.error("Failed to fetch availability:", err);
      }
    };

    fetchAvailability();
  }, [serviceId]);

  const generateTimeSlots = () => {
    const slots = [];
    const start = 9;
    const end = 20;
    
    for (let hour = start; hour < end; hour++) {
      for (let min of ['00', '30']) {
        slots.push(`${hour.toString().padStart(2, '0')}:${min}`);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const handleDateSelect = (date: string) => {
    setBookingData(prev => ({ ...prev, date }));
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
            unavailableDates={unavailableDates}
            timeSlots={timeSlots}
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
