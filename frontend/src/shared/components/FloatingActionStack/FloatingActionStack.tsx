import React from 'react';
import styles from './FloatingActionStack.module.css';

const FloatingActionStack: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className={styles.stack} role="presentation">
    {children}
  </div>
);

export default FloatingActionStack;
