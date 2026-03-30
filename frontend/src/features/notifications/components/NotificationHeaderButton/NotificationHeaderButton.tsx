import React, { useEffect, useRef, useState } from 'react';
import { useNotificationsPanel } from '../../hooks/useNotificationsPanel';
import NotificationPanelContent from '../NotificationPanelContent/NotificationPanelContent';
import styles from './NotificationHeaderButton.module.css';

const NotificationHeaderButton: React.FC = () => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panel = useNotificationsPanel();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  if (!panel.isUserStored) {
    return null;
  }

  const unread = panel.notifications.length;

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={`${styles.bell} ${open ? styles.bellActive : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Notifications"
        title="Notifications"
      >
        <span className={styles.bellIcon} aria-hidden>
          🔔
        </span>
        {unread > 0 && (
          <span className={styles.badge}>{unread > 99 ? '99+' : unread}</span>
        )}
      </button>
      <div
        className={`${styles.backdrop} ${open ? styles.backdropVisible : ''}`}
        aria-hidden
      />
      <div
        className={`${styles.panelShell} ${open ? styles.panelShellOpen : ''}`}
        role="dialog"
        aria-label="Notifications"
      >
        <div className={styles.panelInner}>
          <NotificationPanelContent
            notifications={panel.notifications}
            loading={panel.loading}
            error={panel.error}
            isUserStored={panel.isUserStored}
            load={panel.load}
            handleDismiss={panel.handleDismiss}
            handleClearAll={panel.handleClearAll}
            layout="dropdown"
          />
        </div>
      </div>
    </div>
  );
};

export default NotificationHeaderButton;
