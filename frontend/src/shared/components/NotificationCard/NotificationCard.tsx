import React from 'react';
import type { NotificationItem } from '../../../features/notifications/services/notificationService';
import styles from './NotificationCard.module.css';

export interface NotificationCardProps {
  notification: NotificationItem;
  onDismiss: (id: number) => void;
  formatDate?: (iso: string) => string;
}

const defaultFormatDate = (iso: string): string => {
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

const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onDismiss,
  formatDate = defaultFormatDate,
}) => {
  const senderLabel =
    notification.sender?.fullName || notification.sender?.username || null;

  return (
    <article className={styles.card} role="listitem">
      <div className={styles.iconWrap} aria-hidden>
        <span className={styles.icon}>🔔</span>
      </div>
      <div className={styles.body}>
        <p className={styles.message}>{notification.message}</p>
        {senderLabel && (
          <span className={styles.sender}>From {senderLabel}</span>
        )}
        <time className={styles.time} dateTime={notification.createdAt}>
          {formatDate(notification.createdAt)}
        </time>
      </div>
      <button
        type="button"
        className={styles.dismiss}
        onClick={() => onDismiss(notification.id)}
        aria-label="Dismiss notification"
        title="Dismiss"
      >
        <span className={styles.dismissIcon} aria-hidden>×</span>
      </button>
    </article>
  );
};

export default NotificationCard;
