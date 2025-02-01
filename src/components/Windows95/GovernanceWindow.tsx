import React, { useEffect, useState } from 'react';
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
  const [defaultPosition, setDefaultPosition] = useState(props.position);

  useEffect(() => {
    if (!props.position) {
      // Set initial position only if not already provided
      const windowWidth = window.innerWidth;
      setDefaultPosition({
        x: windowWidth - 950 - 20, // Window width - governance window width - margin
        y: 20
      });
      
      // Notify parent of position change
      props.onMove(props.id, {
        x: windowWidth - 950 - 20,
        y: 20
      });
    }
  }, [props.id, props.onMove, props.position]);

  return (
    <BaseWindow
      {...props}
      position={defaultPosition}
      icon="/governance.png"
      className={styles.governanceWindow}
      minWidth={950}
      minHeight={600}
    />
  );
};

export default GovernanceWindow; 