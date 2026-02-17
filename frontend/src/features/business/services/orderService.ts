const API_URL = 'http://localhost:8080/api/orders';

const getAuthToken = (): string | null => {
  try {
    const raw = localStorage.getItem('petpal_user');
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data?.token ?? null;
  } catch {
    return null;
  }
};

export interface OrderItemForStore {
  productName: string;
  quantity: number;
  priceAtOrder: number;
}

export interface OrderForBusiness {
  orderId: number;
  createdAt: string;
  user: { fullName: string; phoneNumber: string; address: string };
  items: OrderItemForStore[];
}

export const orderService = {
  getOrdersByBusiness: async (businessId: number): Promise<OrderForBusiness[]> => {
    const token = getAuthToken();
    if (!token) throw new Error('Not authenticated');
    const res = await fetch(`${API_URL}/business/${businessId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      if (res.status === 404) return [];
      throw new Error('Failed to fetch orders');
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },
};
