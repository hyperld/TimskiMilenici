import React from 'react';
import type { NotificationItem } from '../../services/notificationService';
import NotificationCard from '../NotificationCard/NotificationCard';
import { formatNotificationDate } from '../../utils/formatNotificationDate';
import styles from './NotificationPanelContent.module.css';

export interface NotificationPanelContentProps {
  notifications: NotificationItem[];
  loading: boolean;
  error: string | null;
  isUserStored: boolean;
  load: (showLoading?: boolean) => void;
  handleDismiss: (id: number) => void;
  handleClearAll: () => void;
  layout: 'embedded' | 'dropdown';
}

const NotificationPanelContent: React.FC<NotificationPanelContentProps> = ({
  notifications,
  loading,
  error,
  isUserStored,
  load,
  handleDismiss,
  handleClearAll,
  layout,
}) => {
  const shellClass =
    layout === 'dropdown'
      ? `${styles.shell} ${styles.shellDropdown} ${styles.shellDropdownFill}`
      : `${styles.shell} ${styles.shellEmbedded}`;
  const listClass = layout === 'dropdown' ? `${styles.list} ${styles.listDropdown}` : styles.list;

  if (!isUserStored) {
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
        <button type="button" className={styles.retryBtn} onClick={() => load(true)}>
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
    <div className={shellClass}>
      <header className={styles.header}>
        <h2 className={styles.listTitle}>Notifications</h2>
        <span className={styles.count}>{notifications.length}</span>
        {notifications.length > 0 && (
          <button
            type="button"
            className={styles.clearBtn}
            onClick={handleClearAll}
            aria-label="Clear all notifications"
            title="Clear all"
          >
            Clear all
          </button>
        )}
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
      <ul className={listClass} role="list">
        {notifications.map((n) => (
          <li key={n.id} className={styles.listItem}>
            <NotificationCard
              notification={n}
              onDismiss={handleDismiss}
              formatDate={formatNotificationDate}
            />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NotificationPanelContent;
