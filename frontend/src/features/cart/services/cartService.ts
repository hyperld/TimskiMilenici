const API_URL = 'http://localhost:8080/api/cart';

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

export interface CartProduct {
  id: number;
  name?: string;
  price?: number;
  stockQuantity?: number;
}

export interface CartItemResponse {
  id: number;
  product: CartProduct;
  quantity: number;
}

export interface CartResponse {
  id: number;
  items: CartItemResponse[];
}

export const cartService = {
  getCart: async (): Promise<CartResponse | null> => {
    const token = getAuthToken();
    if (!token) return null;
    const res = await fetch(API_URL, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return null;
    return res.json();
  },

  getItemCount: async (): Promise<number> => {
    const token = getAuthToken();
    if (!token) return 0;
    const res = await fetch(`${API_URL}/count`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return 0;
    const data = await res.json();
    return data?.count ?? 0;
  },

  addItem: async (productId: number, quantity: number = 1): Promise<CartResponse | null> => {
    const token = getAuthToken();
    if (!token) throw new Error('Not authenticated');
    const res = await fetch(`${API_URL}/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ productId, quantity }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to add to cart');
    }
    return res.json();
  },

  updateItemQuantity: async (cartItemId: number, quantity: number): Promise<CartResponse | null> => {
    const token = getAuthToken();
    if (!token) throw new Error('Not authenticated');
    const res = await fetch(`${API_URL}/items/${cartItemId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ quantity }),
    });
    if (!res.ok) throw new Error('Failed to update quantity');
    return res.json();
  },

  removeItem: async (cartItemId: number): Promise<void> => {
    const token = getAuthToken();
    if (!token) throw new Error('Not authenticated');
    const res = await fetch(`${API_URL}/items/${cartItemId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to remove item');
  },

  checkout: async (): Promise<{ message: string; orderId: number }> => {
    const token = getAuthToken();
    if (!token) throw new Error('Not authenticated');
    const res = await fetch(`${API_URL}/checkout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data?.error ?? 'Checkout failed.';
      throw new Error(typeof msg === 'string' ? msg : 'Checkout failed.');
    }
    return { message: data?.message ?? 'Order confirmed', orderId: data?.orderId };
  },
};
