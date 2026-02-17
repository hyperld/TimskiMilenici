const API_URL = 'http://localhost:8080/api/notifications';

const getAuthToken = (): string | null => {
  const userDataStr = localStorage.getItem('petpal_user');
  if (!userDataStr) return null;
  try {
    const data = JSON.parse(userDataStr);
    return data?.token ?? null;
  } catch {
    return null;
  }
};

export interface NotificationSender {
  id: number;
  username?: string;
  fullName?: string;
}

export interface NotificationItem {
  id: number;
  message: string;
  sender: NotificationSender | null;
  receiver: { id: number };
  dismissed: boolean;
  createdAt: string;
}

export const notificationService = {
  getMyNotifications: async (): Promise<NotificationItem[]> => {
    const token = getAuthToken();
    if (!token) return [];
    const response = await fetch(API_URL, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || `Failed to load notifications (${response.status})`);
    }
    return await response.json();
  },

  dismiss: async (notificationId: number): Promise<void> => {
    const token = getAuthToken();
    if (!token) throw new Error('Not authenticated');
    const response = await fetch(`${API_URL}/${notificationId}/dismiss`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to dismiss notification');
    }
  },
};
