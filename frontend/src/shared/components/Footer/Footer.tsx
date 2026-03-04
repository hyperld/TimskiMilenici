import React from 'react';
import styles from './Footer.module.css';

const Footer: React.FC = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.content}>
        <span className={styles.placeholderText}>
          zogi - hyper - marz
        </span>
      </div>
    </footer>
  );
};

export default Footer;

