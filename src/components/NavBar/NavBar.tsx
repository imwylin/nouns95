import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ConnectButton from './ConnectButton/ConnectButton';
import TreasuryBalance from './TreasuryBalance/TreasuryBalance';
import styles from './Navbar.module.css';

interface NavbarProps {
  backgroundColor?: string;
}

const Navbar: React.FC<NavbarProps> = () => {
  return (
    <header>
      <div className={`${styles.navbar} win95-window-title`}>
        <div className={styles.leftSection}>
          <div className={styles.logo}>
            <Link href="/">
              <Image
                src="/logo.svg"
                alt="Nouns Logo"
                fill
                style={{
                  objectFit: 'contain',
                }}
              />
            </Link>
          </div>
          <span style={{ marginLeft: '8px' }}>Nouns 95</span>
        </div>

        <div className={styles.rightSection}>
          <button className="win95-button" style={{ width: '24px', height: '24px', padding: '0', fontSize: '16px' }}>_</button>
          <button className="win95-button" style={{ width: '24px', height: '24px', padding: '0', fontSize: '14px' }}>□</button>
          <button className="win95-button" style={{ width: '24px', height: '24px', padding: '0', fontSize: '14px' }}>×</button>
        </div>
      </div>
      
      <nav className={`${styles.menuBar} win95-panel`}>
        <div className={styles.leftSection}>
          <TreasuryBalance />
          <Link href="/governance" className={styles.proposeButton}>
            Governance
          </Link>
        </div>
        <div className={styles.rightSection}>
          <ConnectButton />
        </div>
      </nav>
    </header>
  );
};

export default Navbar;