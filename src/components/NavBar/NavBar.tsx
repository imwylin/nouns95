import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ConnectButton from './ConnectButton/ConnectButton';
import TreasuryBalance from './TreasuryBalance/TreasuryBalance';
import styles from './NavBar.module.css';
import EthGasPrice from './EthGasPrice/EthGasPrice';

interface NavbarProps {
  backgroundColor?: string;
}

const Navbar: React.FC<NavbarProps> = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header>
      <nav className={`${styles.menuBar} win95-panel`}>
        <div className={styles.leftSection}>
          <TreasuryBalance />
        </div>
        <div className={styles.rightSection}>
          <ConnectButton />
          <button 
            className={styles.menuButton}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Menu"
          >
            <div className={styles.menuIcon}>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div className={`${styles.mobileMenu} ${isMenuOpen ? styles.open : ''}`}>
        <div className={styles.mobileButtons}>
          <TreasuryBalance />
        </div>
      </div>
    </header>
  );
};

export default Navbar;