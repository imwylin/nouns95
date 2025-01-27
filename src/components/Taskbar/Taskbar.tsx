import React, { useState, useEffect } from 'react';
import styles from './Taskbar.module.css';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import ErrorDialog from '../ErrorDialog/ErrorDialog';

interface Window {
  id: string;
  title: string;
  content: React.ReactNode;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  position?: { x: number; y: number };
}

interface TaskbarProps {
  activeWindows: Window[];
  onWindowSelect: (id: string) => void;
  openWindow: (id: string, title: string, content: React.ReactNode) => void;
}

const Studio = dynamic(() => import('../../pages/studio'), { ssr: false });
const Auction = dynamic(() => import('../../pages/auction'), { ssr: false });
const GovernanceContent = dynamic(() => import('../../pages/governance').then(mod => ({ default: mod.GovernanceContent })), { ssr: false });

const Taskbar: React.FC<TaskbarProps> = ({ activeWindows, onWindowSelect, openWindow }) => {
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);
  const [activeMenuItem, setActiveMenuItem] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showError, setShowError] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const router = useRouter();
  
  const getFormattedTime = () => {
    return new Date().toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      hourCycle: 'h12'
    }).replace(/\s/g, '');
  };

  const [currentTime, setCurrentTime] = useState(getFormattedTime());

  useEffect(() => {
    const updateTime = () => setCurrentTime(getFormattedTime());
    const now = new Date();
    const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
    
    const initialTimeout = setTimeout(() => {
      updateTime();
      const timer = setInterval(updateTime, 60000);
      return () => clearInterval(timer);
    }, msUntilNextMinute);

    updateTime();
    return () => clearTimeout(initialTimeout);
  }, []);

  // Close start menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(`.${styles.startButton}`) && !target.closest(`.${styles.startMenuContainer}`)) {
        setIsStartMenuOpen(false);
        setActiveMenuItem(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Add mobile detection
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);

    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const menuItems = [
    { 
      label: 'Programs',
      icon: '/programs.png',
      hasSubmenu: true,
      items: [
        { label: 'Governance', href: '/governance', icon: '/governance.png' },
        { label: 'Studio', href: '/studio', icon: '/studio.png' },
        { label: 'Auction', href: '/', icon: '/auction.png' }
      ]
    },
    { 
      label: 'Settings',
      icon: '/settings.png',
      hasSubmenu: true,
      items: [
        { label: 'Goldsky', href: 'https://api.goldsky.com/api/public/project_cldf2o9pqagp43svvbk5u3kmo/subgraphs/nouns/prod/gn', icon: '/goldsky.png', external: true },
        { label: 'GitHub', href: 'https://github.com/imwylin/nouns95/tree/main', icon: '/github.png', external: true }
      ]
    },
    { type: 'divider' as const },
    { label: 'Explore', icon: '/nounsworld.gif', href: 'https://nouns.world', external: true },
    { label: 'Probe', icon: '/probe.png', href: 'https://probe.wtf', external: true },
    { label: 'Help', icon: '/help.png', onClick: () => {
      setShowHelp(true);
      setIsStartMenuOpen(false);
    }},
    { type: 'divider' as const },
    { label: 'Shut Down...', icon: '/shutdown.png', onClick: () => {
      setShowError(true);
      setIsStartMenuOpen(false);
    }},
  ];

  const getCurrentPageTitle = () => {
    const path = router.pathname;
    if (path === '/') return 'Auction';
    return path.slice(1).charAt(0).toUpperCase() + path.slice(2);
  };

  const handleMenuItemClick = (item: any) => {
    if (item.hasSubmenu) {
      setActiveMenuItem(activeMenuItem === item.label ? null : item.label);
    } else {
      setIsStartMenuOpen(false);
      setActiveMenuItem(null);
      if (item.onClick) {
        item.onClick();
      } else if (item.external) {
        window.open(item.href, '_blank');
      } else if (item.href) {
        const content = item.href === '/studio' 
          ? <Studio /> 
          : item.href === '/' 
            ? <Auction />
            : item.href === '/governance'
              ? <GovernanceContent inWindow={isMobile} />
              : <div>Loading {item.label}...</div>;
        openWindow(item.href, item.label, content);
      }
    }
  };

  const renderSubmenu = (items: Array<{ label: string; href: string; icon: string; external?: boolean }>) => (
    <div className={styles.submenu}>
      {items.map((subItem) => (
        <div
          key={subItem.label}
          className={styles.submenuItem}
          onClick={(e) => {
            e.stopPropagation();
            setIsStartMenuOpen(false);
            setActiveMenuItem(null);
            if (subItem.external) {
              window.open(subItem.href, '_blank');
            } else {
              const content = subItem.href === '/studio' 
                ? <Studio /> 
                : subItem.href === '/' 
                  ? <Auction />
                  : subItem.href === '/governance'
                    ? <GovernanceContent inWindow={isMobile} />
                    : <div>Loading {subItem.label}...</div>;
              openWindow(subItem.href, subItem.label, content);
            }
          }}
        >
          <Image 
            src={subItem.icon} 
            alt={subItem.label} 
            width={16} 
            height={16} 
            style={{ width: '16px', height: '16px' }}
          />
          <span>{subItem.label}</span>
        </div>
      ))}
    </div>
  );

  // Find the active window (one with highest z-index)
  const getActiveWindowId = () => {
    if (activeWindows.length === 0) return null;
    return activeWindows.reduce((prev, current) => 
      current.zIndex > prev.zIndex ? current : prev
    ).id;
  };

  return (
    <>
      {showError && (
        <ErrorDialog
          message={`Modern browsers prevent web pages from closing tabs for security reasons.\n\nPress Ctrl+W (or Cmd+W on a Mac,) to close this tab manually.`}
          onClose={() => setShowError(false)}
        />
      )}

      {showHelp && (
        <ErrorDialog
          message="Coming soon"
          onClose={() => setShowHelp(false)}
        />
      )}

      {isStartMenuOpen && (
        <div className={styles.startMenuContainer}>
          <div className={styles.startMenu}>
            <div className={styles.startMenuLeft}>
              <div className={styles.sidebarContainer}>
                <div className={styles.startMenuSideText}>
                  <span className={styles.startMenuSideTextBold}>Nouns</span>
                  <span className={styles.startMenuSideTextLight}>95</span>
                </div>
              </div>
              <div className={styles.menuContent}>
                {menuItems.map((item, index) => (
                  item.type === 'divider' ? (
                    <div key={`divider-${index}`} className={styles.menuDivider} />
                  ) : (
                    <div
                      key={item.label}
                      className={`${styles.menuItem} ${activeMenuItem === item.label ? styles.menuItemActive : ''}`}
                      onClick={() => handleMenuItemClick(item)}
                    >
                      <Image 
                        src={item.icon} 
                        alt={item.label} 
                        width={item.label === 'Programs' || item.label === 'Settings' || item.label === 'Help' ? 32 : 16} 
                        height={item.label === 'Programs' || item.label === 'Settings' || item.label === 'Help' ? 32 : 16} 
                        style={item.label === 'Explore' ? { width: '16px', height: '16px' } : undefined}
                      />
                      <span>{item.label}</span>
                      {item.hasSubmenu && (
                        <span className={styles.menuItemArrow} />
                      )}
                      {item.hasSubmenu && item.items && renderSubmenu(item.items)}
                    </div>
                  )
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={styles.taskbar}>
        <button 
          className={`${styles.startButton} ${isStartMenuOpen ? styles.startButtonActive : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            setIsStartMenuOpen(!isStartMenuOpen);
            setActiveMenuItem(null);
          }}
        >
          <Image src="/nouns95.png" alt="Start" width={16} height={16} />
          <span>Start</span>
        </button>
        
        <div className={styles.runningApps}>
          {activeWindows.map(window => {
            const isActiveWindow = window.id === getActiveWindowId();
            const icon = window.id === '/studio' 
              ? '/studio.png'
              : window.id === '/' 
                ? '/auction.png'
                : window.id === '/governance'
                  ? '/governance.png'
                  : '/nouns95.png';
            const iconSize = window.id === '/studio' ? 16 : 32;
            return (
              <div
                key={window.id}
                className={`${styles.activeApp} ${isActiveWindow ? styles.activeAppPressed : ''}`}
                onClick={() => onWindowSelect(window.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: window.id === '/studio' ? '4px' : '0' }}>
                  <Image 
                    src={icon} 
                    alt={window.title} 
                    width={iconSize} 
                    height={iconSize} 
                    style={{ width: `${iconSize}px`, height: `${iconSize}px` }}
                  />
                  <span>{window.title}</span>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className={styles.systemTray}>
          <div className={styles.clock}>
            {currentTime}
          </div>
        </div>
      </div>
    </>
  );
};

export default Taskbar; 