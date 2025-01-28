import React, { useState, useEffect, useRef } from 'react';
import styles from './Windows95.module.css';
import Image from 'next/image';

interface BaseWindowProps {
  id: string;
  title: string;
  icon: string;
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
  className?: string;
  minWidth?: number;
  minHeight?: number;
}

const BaseWindow: React.FC<BaseWindowProps> = ({
  id,
  title,
  icon,
  content,
  isMinimized,
  isMaximized,
  zIndex,
  position,
  size,
  onClose,
  onMinimize,
  onMaximize,
  onSelect,
  onMove,
  className = '',
  minWidth = 200,
  minHeight = 150,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const initialStateRef = useRef({
    position: { x: 0, y: 0 },
    size: { width: 0, height: 0 }
  });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - startPosRef.current.x;
        const deltaY = e.clientY - startPosRef.current.y;

        onMove(id, {
          x: initialStateRef.current.position.x + deltaX,
          y: initialStateRef.current.position.y + deltaY
        });
      } else if (isResizing) {
        const deltaX = e.clientX - startPosRef.current.x;
        const deltaY = e.clientY - startPosRef.current.y;

        const newWidth = Math.max(minWidth, initialStateRef.current.size.width + deltaX);
        const newHeight = Math.max(minHeight, initialStateRef.current.size.height + deltaY);

        onMove(id, position || { x: 0, y: 0 }, {
          width: newWidth,
          height: newHeight
        });
      }
    };

    const handleMouseUp = (e: Event) => {
      if (isDragging || isResizing) {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        setIsResizing(false);
        document.body.style.cursor = 'default';
      }
    };

    const handleWindowBlur = () => {
      if (isDragging || isResizing) {
        setIsDragging(false);
        setIsResizing(false);
        document.body.style.cursor = 'default';
      }
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove, { capture: true });
      document.addEventListener('mouseup', handleMouseUp, { capture: true });
      window.addEventListener('blur', handleWindowBlur);

      // Set cursor based on action
      document.body.style.cursor = isResizing ? 'nw-resize' : 'move';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove, { capture: true });
        document.removeEventListener('mouseup', handleMouseUp, { capture: true });
        window.removeEventListener('blur', handleWindowBlur);
        document.body.style.cursor = 'default';
      };
    }
  }, [id, isDragging, isResizing, minWidth, minHeight, onMove, position]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect(id);
    
    setIsDragging(true);
    startPosRef.current = { x: e.clientX, y: e.clientY };
    initialStateRef.current.position = position || { x: 0, y: 0 };
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isMaximized) return;

    onSelect(id);
    
    setIsResizing(true);
    startPosRef.current = { x: e.clientX, y: e.clientY };
    initialStateRef.current.size = size || { width: minWidth, height: minHeight };
  };

  const handleTitleBarButtonClick = (e: React.MouseEvent, action: 'minimize' | 'maximize' | 'close') => {
    e.stopPropagation();
    switch (action) {
      case 'minimize':
        onMinimize(id);
        break;
      case 'maximize':
        onMaximize(id);
        break;
      case 'close':
        onClose(id);
        break;
    }
  };

  if (isMinimized) return null;

  return (
    <div
      className={`${styles.window} ${isMaximized ? styles.maximized : ''} ${className}`}
      style={{
        zIndex,
        transform: !isMaximized && position 
          ? `translate(${position.x}px, ${position.y}px)` 
          : undefined,
        width: !isMaximized && size ? `${size.width}px` : undefined,
        height: !isMaximized && size ? `${size.height}px` : undefined,
        minWidth: `${minWidth}px`,
        minHeight: `${minHeight}px`,
      }}
      data-window-id={id}
      onClick={() => onSelect(id)}
    >
      <div 
        className={styles.titleBar}
        onMouseDown={handleMouseDown}
      >
        <Image src={icon} alt="" width={16} height={16} className={styles.titleBarIcon} />
        <div className={styles.titleBarText}>{title}</div>
        <div className={styles.titleBarButtons}>
          <button onClick={(e) => handleTitleBarButtonClick(e, 'minimize')}>_</button>
          <button onClick={(e) => handleTitleBarButtonClick(e, 'maximize')}>{isMaximized ? '❐' : '□'}</button>
          <button onClick={(e) => handleTitleBarButtonClick(e, 'close')}>×</button>
        </div>
      </div>
      <div className={styles.windowContent}>
        <div className={styles.contentWrapper}>
          {content}
          {(isDragging || isResizing) && (
            <div className={styles.dragOverlay} />
          )}
        </div>
      </div>
      {!isMaximized && (
        <div 
          className={styles.resizeHandle}
          onMouseDown={handleResizeStart}
        />
      )}
    </div>
  );
};

export default BaseWindow; 