import React from 'react';
import styles from './ErrorDialog.module.css';
import Image from 'next/image';

interface ErrorDialogProps {
  message: string;
  onClose: () => void;
}

const ErrorDialog: React.FC<ErrorDialogProps> = ({ message, onClose }) => {
  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        <div className={styles.titleBar}>
          <div className={styles.titleBarLeft}>
            <Image src="/error.png" alt="Error" width={16} height={16} className={styles.titleBarIcon} />
            <span>Error</span>
          </div>
          <button onClick={onClose}>×</button>
        </div>
        <div className={styles.content}>
          <div className={styles.messageContainer}>
            <Image src="/error.png" alt="Error" width={32} height={32} />
            <p>{message}</p>
          </div>
          <div className={styles.buttonContainer}>
            <button onClick={onClose}>OK</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorDialog; 