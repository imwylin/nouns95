import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ConnectButton from './ConnectButton/ConnectButton';
import TreasuryBalance from './TreasuryBalance/TreasuryBalance';
import styles from './NavBar.module.css';

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
                src="/nouns95.png"
                alt="Nouns 95"
                width={20}
                height={20}
                className={styles.logoImage}
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
          <Link href="/studio" className={styles.proposeButton}>
            Studio
          </Link>
          <a 
            href="https://nouns.world" 
            target="_blank" 
            rel="noopener noreferrer" 
            className={`${styles.proposeButton} ${styles.exploreLink}`}
          >
            <div className={styles.exploreContainer}>
              <Image
                src="/nounsworld.gif"
                alt=""
                width={16}
                height={16}
                unoptimized
                className={styles.exploreGif}
              />
            </div>
            Explore
          </a>
          <a 
            href="https://www.probe.wtf" 
            target="_blank" 
            rel="noopener noreferrer" 
            className={`${styles.proposeButton} ${styles.probeLink}`}
          >
            <div className={styles.probeContainer}>
              <Image
                src="/probe.png"
                alt=""
                width={16}
                height={16}
                className={styles.probeImg}
              />
            </div>
            Probe
          </a>
        </div>
        <div className={styles.rightSection}>
          <ConnectButton />
        </div>
      </nav>
    </header>
  );
};

export default Navbar;