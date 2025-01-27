import React from 'react';
import Image from 'next/image';
import styles from './Desktop.module.css';
import dynamic from 'next/dynamic';

const Studio = dynamic(() => import('../../pages/studio'), { ssr: false });
const Auction = dynamic(() => import('../../pages/auction'), { ssr: false });
const GovernanceContent = dynamic(() => import('../../pages/governance').then(mod => ({ default: mod.GovernanceContent })), { ssr: false });

interface DesktopProps {
  openWindow: (id: string, title: string, content: React.ReactNode) => void;
  isMobile: boolean;
}

const Desktop: React.FC<DesktopProps> = ({ openWindow, isMobile }) => {
  const shortcuts = [
    { label: 'Governance', icon: '/governance.png', href: '/governance' },
    { label: 'Studio', icon: '/studio.png', href: '/studio' },
    { label: 'Auction', icon: '/auction.png', href: '/' }
  ];

  const handleShortcutClick = (shortcut: { label: string; href: string }) => {
    const content = shortcut.href === '/studio' 
      ? <Studio /> 
      : shortcut.href === '/' 
        ? <Auction />
        : shortcut.href === '/governance'
          ? <GovernanceContent inWindow={isMobile} />
          : <div>Loading {shortcut.label}...</div>;
    openWindow(shortcut.href, shortcut.label, content);
  };

  return (
    <div className={styles.desktop}>
      {shortcuts.map((shortcut) => (
        <div
          key={shortcut.label}
          className={styles.shortcut}
          onDoubleClick={() => handleShortcutClick(shortcut)}
        >
          <Image 
            src={shortcut.icon} 
            alt={shortcut.label} 
            width={shortcut.href === '/governance' || shortcut.href === '/' ? 64 : 32} 
            height={shortcut.href === '/governance' || shortcut.href === '/' ? 64 : 32}
            className={styles.shortcutIcon}
          />
          <span>{shortcut.label}</span>
        </div>
      ))}
    </div>
  );
};

export default Desktop; 