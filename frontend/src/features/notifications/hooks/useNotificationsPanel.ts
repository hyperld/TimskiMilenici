import { useCallback, useEffect, useState } from 'react';
import {
  notificationService,
  type NotificationItem,
} from '../services/notificationService';
import { isUserStored } from '../../auth/utils/tokenStorage';

export function useNotificationsPanel() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
      setError(null);
    }
    try {
      const list = await notificationService.getMyNotifications();
      setNotifications(list);
    } catch (e) {
      if (showLoading) {
        setError(e instanceof Error ? e.message : 'Failed to load notifications');
        setNotifications([]);
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!isUserStored()) return;
    const interval = setInterval(() => load(false), 8000);
    return () => clearInterval(interval);
  }, [load]);

  const handleDismiss = async (id: number) => {
    try {
      await notificationService.dismiss(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to dismiss');
    }
  };

  const handleClearAll = async () => {
    try {
      await notificationService.dismissAll();
      setNotifications([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to clear notifications');
    }
  };

  return {
    notifications,
    loading,
    error,
    load,
    handleDismiss,
    handleClearAll,
    isUserStored: isUserStored(),
  };
}
