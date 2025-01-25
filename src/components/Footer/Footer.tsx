import React, { useState, useEffect } from 'react';
import styles from './Footer.module.css';

const Footer: React.FC = () => {
  const getFormattedTime = () => {
    return new Date().toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const [currentTime, setCurrentTime] = useState(getFormattedTime());

  useEffect(() => {
    // Update immediately and then set interval
    const updateTime = () => setCurrentTime(getFormattedTime());
    
    // Calculate ms until next minute
    const now = new Date();
    const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
    
    // Set initial timeout to sync with the start of next minute
    const initialTimeout = setTimeout(() => {
      updateTime();
      // Once synced with minute, start the interval
      const timer = setInterval(updateTime, 60000);
      // Cleanup interval on unmount
      return () => clearInterval(timer);
    }, msUntilNextMinute);

    // Update immediately for first render
    updateTime();
    
    // Cleanup timeout on unmount
    return () => clearTimeout(initialTimeout);
  }, []);

  return (
    <footer className={styles.footer}>
      <div className={styles.title}>
        <span>🌐 Connected to Ethereum</span>
        <div className={styles.divider} />
        <span>cc0, no rights reserved</span>
      </div>
      <div className={styles.subtitle}>
        {currentTime}
      </div>
    </footer>
  );
};

export default Footer;