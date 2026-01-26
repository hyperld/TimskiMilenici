import React from 'react';
import styles from './WelcomeHeader.module.css';

const WelcomeHeader: React.FC = () => {
  return (
    <header className={styles.welcomeHeader}>
      <h1>PetPal</h1>
      <p>Your best friend's best friend.</p>
    </header>
  );
};

export default WelcomeHeader;
