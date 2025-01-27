import React from 'react';
import styles from './Footer.module.css';

const Footer: React.FC = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.title}>
        <span>🌐 Connected to Ethereum</span>
        <div className={styles.divider} />
        <span>cc0, no rights reserved</span>
      </div>
    </footer>
  );
};

export default Footer;