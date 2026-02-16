import React, { useEffect, useState } from 'react';
import {
  notificationService,
  type NotificationItem,
} from '../../../features/notifications/services/notificationService';
import NotificationCard from '../NotificationCard/NotificationCard';
import styles from './NotificationTab.module.css';

const formatDate = (iso: string): string => {
  try {
    const d = new Date(iso);
    const now = new Date();
    const sameDay =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();
    if (sameDay) {
      return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
};

const NotificationTab: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async (showLoading = true) => {
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
  };

  useEffect(() => {
    load();
  }, []);

  // Refetch notifications periodically so owner sees new bookings without refreshing
  useEffect(() => {
    if (!isLoggedIn()) return;
    const interval = setInterval(() => load(false), 8000); // every 8s
    return () => clearInterval(interval);
  }, []);

  const handleDismiss = async (id: number) => {
    try {
      await notificationService.dismiss(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to dismiss');
    }
  };

  const isLoggedIn = () => {
    try {
      const raw = localStorage.getItem('petpal_user');
      if (!raw) return false;
      const data = JSON.parse(raw);
      return !!data?.token;
    } catch {
      return false;
    }
  };

  if (!isLoggedIn()) {
    return (
      <div className={styles.placeholder}>
        <div className={styles.icon}>🔔</div>
        <h3 className={styles.title}>Notifications</h3>
        <p className={styles.text}>Sign in to see your notifications.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.placeholder}>
        <div className={styles.icon}>🔔</div>
        <p className={styles.text}>Loading notifications…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.placeholder}>
        <div className={styles.icon}>🔔</div>
        <p className={styles.text}>{error}</p>
        <button type="button" className={styles.retryBtn} onClick={load}>
          Retry
        </button>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className={styles.placeholder}>
        <div className={styles.icon}>🔔</div>
        <h3 className={styles.title}>Notifications</h3>
        <p className={styles.text}>No new notifications.</p>
        <button type="button" className={styles.retryBtn} onClick={() => load(true)}>
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <h2 className={styles.listTitle}>Notifications</h2>
        <span className={styles.count}>{notifications.length}</span>
        <button
          type="button"
          className={styles.refreshBtn}
          onClick={() => load(false)}
          aria-label="Refresh notifications"
          title="Refresh"
        >
          ↻
        </button>
      </header>
      <ul className={styles.list} role="list">
        {notifications.map((n) => (
          <li key={n.id} className={styles.listItem}>
            <NotificationCard
              notification={n}
              onDismiss={handleDismiss}
              formatDate={formatDate}
            />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NotificationTab;
