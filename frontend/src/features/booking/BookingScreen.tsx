import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import TopBar from '../../shared/components/TopBar/TopBar';
import { bookingService, buildBookedTimesByDate } from './services/bookingService';
import { useAuth } from '../../features/auth/hooks/useAuth';
import BookingForm from './components/BookingForm/BookingForm';
import BookingSummary from './components/BookingSummary/BookingSummary';
import BookingSuccess from './components/BookingSuccess/BookingSuccess';
import { businessService } from '../business/services/businessService';
import {
  normalizeWorkingSchedule,
  buildCalendarUnavailableDates,
  generateTimeSlotsForDate,
  type WorkingSchedule,
} from '../business/utils/workingSchedule';

function normalizeFullDateEntry(d: unknown): string {
  if (typeof d === 'string') return d;
  if (Array.isArray(d) && d.length >= 3) {
    const [y, m, day] = d;
    return `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  return String(d);
}

const BookingScreen: React.FC = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
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
  const [businessSchedule, setBusinessSchedule] = useState<WorkingSchedule | null>(null);
  /** When store bookings are loaded for calendar; otherwise use /full-dates API. */
  const [calendarMode, setCalendarMode] = useState<'store' | 'service'>('service');

  const scheduleNorm = useMemo(
    () => businessSchedule ?? normalizeWorkingSchedule(null),
    [businessSchedule]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!serviceId) return;
      const svcId = parseInt(serviceId, 10);
      if (isNaN(svcId)) return;
      try {
        let businessId: number | undefined;
        if (storeId != null && storeId !== '') {
          const sid = typeof storeId === 'string' ? parseInt(storeId, 10) : Number(storeId);
          if (!isNaN(sid)) businessId = sid;
        }
        if (businessId == null) {
          const svc = await businessService.getServiceById(svcId);
          businessId = svc.businessId;
        }
        if (businessId != null) {
          const b = await businessService.getBusinessById(businessId);
          if (!cancelled) setBusinessSchedule(normalizeWorkingSchedule(b.workingSchedule));
        } else if (!cancelled) {
          setBusinessSchedule(normalizeWorkingSchedule(null));
        }
      } catch {
        if (!cancelled) setBusinessSchedule(normalizeWorkingSchedule(null));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [serviceId, storeId]);

  const bookedTimesByDate = useMemo(() => buildBookedTimesByDate(bookings), [bookings]);

  const calendarUnavailableFromBookings = useMemo(
    () => buildCalendarUnavailableDates(scheduleNorm, bookedTimesByDate),
    [scheduleNorm, bookedTimesByDate]
  );

  const datesWithBookings = useMemo(() => Object.keys(bookedTimesByDate), [bookedTimesByDate]);

  useEffect(() => {
    let cancelled = false;
    if (!serviceId) return;
    const svcId = parseInt(serviceId, 10);
    if (isNaN(svcId)) return;

    (async () => {
      try {
        let storeIdNum: number | null = null;
        if (storeId != null && storeId !== '') {
          const p = typeof storeId === 'string' ? parseInt(storeId, 10) : Number(storeId);
          if (!isNaN(p)) storeIdNum = p;
        }
        const svc = await businessService.getServiceById(svcId);
        if (storeIdNum == null && svc.businessId != null) {
          storeIdNum = svc.businessId;
        }

        if (storeIdNum != null) {
          const start = new Date();
          const end = new Date();
          end.setDate(end.getDate() + 60);
          const startStr = start.toISOString().split('T')[0];
          const endStr = end.toISOString().split('T')[0];
          const data = await bookingService.getBookingsByStoreInRange(storeIdNum, startStr, endStr);
          if (!cancelled) {
            setBookings(Array.isArray(data) ? data : []);
            setUnavailableDates([]);
            setCalendarMode('store');
          }
        } else {
          const fd = await bookingService.getFullDates(svcId);
          if (!cancelled) {
            setBookings([]);
            const asStrings = Array.isArray(fd) ? fd.map(normalizeFullDateEntry) : [];
            setUnavailableDates(asStrings);
            setCalendarMode('service');
          }
        }
      } catch {
        if (!cancelled) {
          setBookings([]);
          bookingService
            .getFullDates(svcId)
            .then((fd) => {
              const asStrings = Array.isArray(fd) ? fd.map(normalizeFullDateEntry) : [];
              setUnavailableDates(asStrings);
              setCalendarMode('service');
            })
            .catch(() => {
              setUnavailableDates([]);
              setCalendarMode('service');
            });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [storeId, serviceId]);

  const effectiveUnavailableDates = useMemo(() => {
    if (calendarMode === 'store') return calendarUnavailableFromBookings;
    return unavailableDates;
  }, [calendarMode, calendarUnavailableFromBookings, unavailableDates]);

  const reservedTimeSlots = useMemo(
    () => (bookingData.date ? (bookedTimesByDate[bookingData.date] || []) : []),
    [bookingData.date, bookedTimesByDate]
  );

  const timeSlotsForDate = useMemo(
    () =>
      bookingData.date ? generateTimeSlotsForDate(bookingData.date, scheduleNorm) : [],
    [bookingData.date, scheduleNorm]
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
        serviceId: parseInt(serviceId, 10),
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
      <div className="appRouteRoot">
        <TopBar userName={userName} />
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            padding: '2rem 1rem',
          }}
        >
          <BookingSuccess date={bookingData.date} time={bookingData.time} />
        </div>
      </div>
    );
  }

  return (
    <div className="appRouteRoot">
      <TopBar userName={userName} />
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          maxWidth: '1000px',
          margin: '0 auto',
          padding: '2rem',
          width: '100%',
        }}
      >
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
            timeSlots={timeSlotsForDate}
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
