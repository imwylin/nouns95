import React from 'react';
import BaseWindow from './BaseWindow';
import styles from './Windows95.module.css';

interface InternetWindowProps {
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

const InternetWindow: React.FC<InternetWindowProps> = (props) => {
  return (
    <BaseWindow
      {...props}
      icon="/internetexplorer.png"
      className={styles.internetWindow}
      minWidth={640}
      minHeight={480}
    />
  );
};

export default InternetWindow; 