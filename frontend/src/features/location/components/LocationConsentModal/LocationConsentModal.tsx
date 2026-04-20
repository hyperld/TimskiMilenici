import React from 'react';
import Button from '../../../../shared/components/Button/Button';
import styles from './LocationConsentModal.module.css';

interface LocationConsentModalProps {
  open: boolean;
  onAllow: () => void;
  onDeny: () => void;
}

const LocationConsentModal: React.FC<LocationConsentModalProps> = ({ open, onAllow, onDeny }) => {
  if (!open) return null;
  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="location-consent-title">
      <div className={styles.card}>
        <div className={styles.iconWrap} aria-hidden>📍</div>
        <h2 id="location-consent-title" className={styles.title}>Find stores near you</h2>
        <p className={styles.body}>
          We can show the nearest pet stores if you share your location. Your coordinates stay on your
          device and are only sent with the search request. You can switch this off at any time.
        </p>
        <ul className={styles.bullets}>
          <li>Used only to rank and filter stores by distance.</li>
          <li>Never stored on our servers.</li>
          <li>Revoke any time from your browser settings.</li>
        </ul>
        <div className={styles.actions}>
          <Button variant="secondary" onClick={onDeny}>Not now</Button>
          <Button onClick={onAllow}>Allow location</Button>
        </div>
      </div>
    </div>
  );
};

export default LocationConsentModal;
