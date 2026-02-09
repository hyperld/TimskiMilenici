const API_URL = 'http://localhost:8080/api/bookings';

const getAuthUser = () => {
  const userDataStr = localStorage.getItem('petpal_user');
  return userDataStr ? JSON.parse(userDataStr) : null;
};

/** Parse backend bookingTime (ISO string or array [y,m,d,h,min,s]) into date and time. */
export function parseBookingDateTime(raw: unknown): { dateStr: string; timeStr: string } | null {
  if (raw == null) return null;
  if (typeof raw === 'string') {
    const s = String(raw).trim();
    const tIdx = s.indexOf('T');
    if (tIdx === -1) return null;
    const dateStr = s.slice(0, tIdx);
    const timePart = s.slice(tIdx + 1);
    const timeStr = timePart.length >= 5 ? timePart.slice(0, 5) : '';
    if (!dateStr || !timeStr) return null;
    return { dateStr, timeStr };
  }
  if (Array.isArray(raw) && raw.length >= 5) {
    const [y, m, d, h, min] = raw;
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const timeStr = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
    return { dateStr, timeStr };
  }
  return null;
}

/** Build map of date -> reserved time slots (HH:mm) from bookings (non-cancelled). */
export function buildBookedTimesByDate(bookings: any[]): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  (bookings || [])
    .filter((b: any) => b.status !== 'CANCELLED')
    .forEach((b: any) => {
      const parsed = parseBookingDateTime(b.bookingTime);
      if (!parsed) return;
      const { dateStr, timeStr } = parsed;
      if (!map[dateStr]) map[dateStr] = [];
      if (!map[dateStr].includes(timeStr)) map[dateStr].push(timeStr);
    });
  return map;
}

/** Dates where every slot (totalSlots) is reserved. */
export function buildFullDates(bookedTimesByDate: Record<string, string[]>, totalSlots: number): string[] {
  const full: string[] = [];
  Object.keys(bookedTimesByDate).forEach((dateStr) => {
    const booked = bookedTimesByDate[dateStr] || [];
    if (booked.length >= totalSlots) full.push(dateStr);
  });
  return full;
}

/** Build map of (date -> time -> list of user names) for tooltips. */
export function buildBookedSlotUserByDate(bookings: any[]): Record<string, Record<string, string[]>> {
  const map: Record<string, Record<string, string[]>> = {};
  (bookings || [])
    .filter((b: any) => b.status !== 'CANCELLED')
    .forEach((b: any) => {
      const parsed = parseBookingDateTime(b.bookingTime);
      if (!parsed) return;
      const { dateStr, timeStr } = parsed;
      const name = b.user?.fullName || b.user?.username || 'Guest';
      if (!map[dateStr]) map[dateStr] = {};
      if (!map[dateStr][timeStr]) map[dateStr][timeStr] = [];
      if (!map[dateStr][timeStr].includes(name)) map[dateStr][timeStr].push(name);
    });
  return map;
}

export const bookingService = {
  /**
   * Retrieves all "full" dates for a specific service within a date range.
   */
  getFullDates: async (serviceId: number, startDate?: string, endDate?: string): Promise<string[]> => {
    // If range not provided, use a default range (e.g., today to +30 days)
    const start = startDate || new Date().toISOString().split('T')[0];
    const end = endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const response = await fetch(`${API_URL}/full-dates/${serviceId}?start=${start}&end=${end}`);
    if (!response.ok) {
      throw new Error('Failed to fetch full dates');
    }
    return await response.json();
  },

  /**
   * Aggregates full dates across multiple services to provide store-level full dates.
   */
  getFullDatesByStore: async (serviceIds: number[], startDate?: string, endDate?: string): Promise<string[]> => {
    if (!serviceIds || serviceIds.length === 0) return [];
    const lists = await Promise.all(
      serviceIds.map(id => bookingService.getFullDates(id, startDate, endDate).catch(() => []))
    );
    const all = lists.flat();
    // unique
    return Array.from(new Set(all)).sort();
  },

  /**
   * Returns all bookings for a specific store and date.
   * GET /api/bookings/store/{storeId}?date=YYYY-MM-DD
   */
  getBookingsByStoreDate: async (storeId: number, date: string): Promise<any[]> => {
    const user = getAuthUser();
    const url = `${API_URL}/store/${storeId}?date=${encodeURIComponent(date)}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${user?.token}`
      }
    });
    if (!response.ok) return [];
    return await response.json();
  },

  /**
   * Returns all bookings for a store within a date range (inclusive).
   * GET /api/bookings/store/{storeId}?start=YYYY-MM-DD&end=YYYY-MM-DD
   */
  getBookingsByStoreInRange: async (storeId: number, startDate: string, endDate: string): Promise<any[]> => {
    const user = getAuthUser();
    const url = `${API_URL}/store/${storeId}?start=${encodeURIComponent(startDate)}&end=${encodeURIComponent(endDate)}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${user?.token}`
      }
    });
    if (!response.ok) return [];
    return await response.json();
  },

  getBookedTimesByStoreDate: async (storeId: number, date: string): Promise<string[]> => {
    const bookings = await bookingService.getBookingsByStoreDate(storeId, date);
    const map = buildBookedTimesByDate(bookings);
    return map[date] || [];
  },

  /**
   * Saves a new booking.
   */
  createBooking: async (bookingData: { serviceId: number; date: string; time: string; notes?: string }): Promise<{ success: boolean; [key: string]: any }> => {
    const user = getAuthUser();
    
    // Construct the payload matching backend Booking entity
    const payload = {
      user: { id: user?.user?.id || user?.userId },
      service: { id: bookingData.serviceId },
      bookingTime: `${bookingData.date}T${bookingData.time}:00`,
      status: 'PENDING',
      notes: bookingData.notes
    };

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user?.token}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to create booking');
    }

    const data = await response.json();
    return { success: true, ...data };
  },

  /**
   * Update booking status (e.g. CANCELLED).
   * PATCH /api/bookings/{id}/status?status=CANCELLED
   */
  updateBookingStatus: async (bookingId: number, status: string): Promise<void> => {
    const user = getAuthUser();
    const response = await fetch(`${API_URL}/${bookingId}/status?status=${encodeURIComponent(status)}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${user?.token}`
      }
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to update booking');
    }
  },

  /**
   * Delete a booking (used when store owner dismisses it).
   * DELETE /api/bookings/{id}
   */
  deleteBooking: async (bookingId: number): Promise<void> => {
    const user = getAuthUser();
    const response = await fetch(`${API_URL}/${bookingId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${user?.token}`
      }
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to delete booking');
    }
  }
};
