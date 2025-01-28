import React from 'react';
import BaseWindow from './BaseWindow';
import styles from './Windows95.module.css';

interface StudioWindowProps {
  id: string;
  title: string;
  content: React.ReactNode;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  onClose: (id: string) => void;
  onMinimize: (id: string) => void;
  onMaximize: (id: string) => void;
  onSelect: (id: string) => void;
  onMove: (id: string, position: { x: number; y: number }, size?: { width: number; height: number }) => void;
}

const StudioWindow: React.FC<StudioWindowProps> = (props) => {
  return (
    <BaseWindow
      {...props}
      icon="/studio.png"
      className={styles.studioWindow}
      minWidth={1024}
      minHeight={768}
    />
  );
};

export default StudioWindow; 