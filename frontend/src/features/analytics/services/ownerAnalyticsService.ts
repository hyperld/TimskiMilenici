const API_URL = 'http://localhost:8080/api/owner/analytics';

const getAuthToken = () => {
  const userDataStr = localStorage.getItem('petpal_user');
  return userDataStr ? JSON.parse(userDataStr)?.token : null;
};

export interface OverviewPoint {
  day: string;
  bookings: number;
  completed: number;
  cancelled: number;
  revenue: number;
}

export interface OverviewResult {
  points: OverviewPoint[];
  totalBookings: number;
  totalCompleted: number;
  totalCancelled: number;
  totalRevenue: number;
}

export interface ProductSalesRow {
  productId: number;
  productName: string;
  unitsSold: number;
  ordersCount: number;
  revenue: number;
}

export interface PeakTimeBucket {
  dayOfWeek: number;
  hour: number;
  bookings: number;
}

const authHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

interface AnalyticsQueryParams {
  businessId?: number | null;
  from?: string;
  to?: string;
}

const buildQuery = (params?: AnalyticsQueryParams) => {
  if (!params) return '';
  const search = new URLSearchParams();
  if (params.businessId) search.set('businessId', String(params.businessId));
  if (params.from) search.set('from', params.from);
  if (params.to) search.set('to', params.to);
  const qs = search.toString();
  return qs ? `?${qs}` : '';
};

export const ownerAnalyticsService = {
  getOverview: async (params?: AnalyticsQueryParams): Promise<OverviewResult> => {
    const res = await fetch(`${API_URL}/overview${buildQuery(params)}`, {
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to load overview analytics');
    }
    return await res.json();
  },

  getProductSales: async (params?: AnalyticsQueryParams): Promise<ProductSalesRow[]> => {
    const res = await fetch(`${API_URL}/services${buildQuery(params)}`, {
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to load service analytics');
    }
    return await res.json();
  },

  getPeakTimes: async (params?: AnalyticsQueryParams): Promise<PeakTimeBucket[]> => {
    const res = await fetch(`${API_URL}/peak-times${buildQuery(params)}`, {
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to load peak time analytics');
    }
    return await res.json();
  },
};

