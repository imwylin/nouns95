import React from 'react';
import BaseWindow from './BaseWindow';
import styles from './Windows95.module.css';

interface GovernanceWindowProps {
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

const GovernanceWindow: React.FC<GovernanceWindowProps> = (props) => {
  return (
    <BaseWindow
      {...props}
      icon="/governance.png"
      className={styles.governanceWindow}
      minWidth={950}
      minHeight={600}
    />
  );
};

export default GovernanceWindow; 