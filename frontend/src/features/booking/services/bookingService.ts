const API_URL = 'http://localhost:8080/api/bookings';

const getAuthUser = () => {
  const userDataStr = localStorage.getItem('petpal_user');
  return userDataStr ? JSON.parse(userDataStr) : null;
};

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
  }
};
