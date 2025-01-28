import React from 'react';
import styles from './Windows95.module.css';
import InternetWindow from './InternetWindow';
import StudioWindow from './StudioWindow';
import GovernanceWindow from './GovernanceWindow';
import BaseWindow from './BaseWindow';

interface Window {
  id: string;
  title: string;
  content: React.ReactNode;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  icon: string;
}

interface Windows95Props {
  activeWindows: Window[];
  onWindowClose: (id: string) => void;
  onWindowMinimize: (id: string) => void;
  onWindowMaximize: (id: string) => void;
  onWindowSelect: (id: string) => void;
  onWindowMove: (id: string, position: { x: number; y: number }, size?: { width: number; height: number }) => void;
}

const Windows95: React.FC<Windows95Props> = ({
  activeWindows,
  onWindowClose,
  onWindowMinimize,
  onWindowMaximize,
  onWindowSelect,
  onWindowMove
}) => {
  const renderWindow = (window: Window) => {
    const commonProps = {
      id: window.id,
      title: window.title,
      content: window.content,
      isMinimized: window.isMinimized,
      isMaximized: window.isMaximized,
      zIndex: window.zIndex,
      position: window.position,
      size: window.size,
      onClose: onWindowClose,
      onMinimize: onWindowMinimize,
      onMaximize: onWindowMaximize,
      onSelect: onWindowSelect,
      onMove: onWindowMove,
    };

    // Render specific window types based on the window ID
    switch (window.id) {
      case '/internet':
        return <InternetWindow key={window.id} {...commonProps} />;
      case '/studio':
        return <StudioWindow key={window.id} {...commonProps} />;
      case '/governance':
        return <GovernanceWindow key={window.id} {...commonProps} />;
      default:
        // For any other window type, use the base window with the provided icon
        return (
          <BaseWindow
            key={window.id}
            {...commonProps}
            icon={window.icon}
            minWidth={window.id === '/' ? 950 : 200}
            minHeight={window.id === '/' ? 550 : 150}
          />
        );
    }
  };

  return (
    <div className={styles.windows95}>
      {activeWindows.map(window => renderWindow(window))}
    </div>
  );
};

export default Windows95;