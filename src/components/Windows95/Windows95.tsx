import React, { useState, useEffect, useCallback } from 'react';
import styles from './Windows95.module.css';
import Image from 'next/image';

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
  const [dragState, setDragState] = useState({
    isDragging: false,
    windowId: null as string | null,
    startX: 0,
    startY: 0,
    initialPosition: { x: 0, y: 0 }
  });

  const [resizeState, setResizeState] = useState({
    isResizing: false,
    windowId: null as string | null,
    startX: 0,
    startY: 0,
    initialSize: { width: 0, height: 0 }
  });

  const handleMouseDown = (e: React.MouseEvent, windowId: string) => {
    const window = activeWindows.find(w => w.id === windowId);
    if (!window) return;

    onWindowSelect(windowId);
    
    const position = window.position || { x: 0, y: 0 };
    setDragState({
      isDragging: true,
      windowId,
      startX: e.clientX,
      startY: e.clientY,
      initialPosition: position
    });
  };

  const handleResizeStart = (e: React.MouseEvent, windowId: string) => {
    e.stopPropagation();
    const window = activeWindows.find(w => w.id === windowId);
    if (!window || window.isMaximized) return;

    onWindowSelect(windowId);
    
    // Get minimum dimensions based on window type
    let minWidth = 200;
    let minHeight = 150;
    
    if (window.id === '/auction') {
      minWidth = 600;
      minHeight = 650;
    } else if (window.id === '/studio') {
      minWidth = 1024;
      minHeight = 768;
    } else if (window.id === '/governance') {
      minWidth = 800;
      minHeight = 600;
    }

    setResizeState({
      isResizing: true,
      windowId,
      startX: e.clientX,
      startY: e.clientY,
      initialSize: window.size || { width: minWidth, height: minHeight }
    });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (dragState.isDragging && dragState.windowId) {
      const deltaX = e.clientX - dragState.startX;
      const deltaY = e.clientY - dragState.startY;

      // When dragging, only update position
      onWindowMove(dragState.windowId, {
        x: dragState.initialPosition.x + deltaX,
        y: dragState.initialPosition.y + deltaY
      }, undefined);
    } else if (resizeState.isResizing && resizeState.windowId) {
      const window = activeWindows.find(w => w.id === resizeState.windowId);
      if (!window) return;

      const deltaX = e.clientX - resizeState.startX;
      const deltaY = e.clientY - resizeState.startY;

      // Get minimum dimensions based on window type
      let minWidth = 200;
      let minHeight = 150;
      
      if (window.id === '/auction') {
        minWidth = 600;
        minHeight = 650;
      } else if (window.id === '/studio') {
        minWidth = 1024;
        minHeight = 768;
      } else if (window.id === '/governance') {
        minWidth = 800;
        minHeight = 600;
      }

      // Calculate new dimensions while respecting minimums
      const newWidth = Math.max(minWidth, resizeState.initialSize.width + deltaX);
      const newHeight = Math.max(minHeight, resizeState.initialSize.height + deltaY);

      // When resizing, update size only
      onWindowMove(window.id, window.position || { x: 0, y: 0 }, {
        width: newWidth,
        height: newHeight
      });
    }
  }, [dragState, resizeState, activeWindows, onWindowMove]);

  const handleMouseUp = useCallback(() => {
    setDragState(prev => ({ ...prev, isDragging: false, windowId: null }));
    setResizeState(prev => ({ ...prev, isResizing: false, windowId: null }));
  }, []);

  useEffect(() => {
    if (dragState.isDragging || resizeState.isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState.isDragging, resizeState.isResizing, handleMouseMove, handleMouseUp]);

  return (
    <div className={styles.windows95}>
      {activeWindows.map(window => !window.isMinimized && (
        <div
          key={window.id}
          className={`${styles.window} ${window.isMaximized ? styles.maximized : ''}`}
          style={{
            zIndex: window.zIndex,
            transform: !window.isMaximized && window.position 
              ? `translate(${window.position.x}px, ${window.position.y}px)` 
              : undefined,
            width: !window.isMaximized && window.size ? `${window.size.width}px` : undefined,
            height: !window.isMaximized && window.size ? `${window.size.height}px` : undefined
          }}
          data-window-id={window.id}
          onMouseDown={(e) => {
            // If clicking the window content (not title bar or resize handle), select the window
            if (!e.defaultPrevented) {
              onWindowSelect(window.id);
            }
          }}
        >
          <div 
            className={styles.titleBar}
            onMouseDown={(e) => {
              e.preventDefault(); // Prevent window selection from triggering twice
              handleMouseDown(e, window.id);
            }}
          >
            <Image src={window.icon} alt="" width={16} height={16} className={styles.titleBarIcon} />
            <div className={styles.titleBarText}>{window.title}</div>
            <div className={styles.titleBarButtons}>
              <button onClick={() => onWindowMinimize(window.id)}>_</button>
              <button onClick={() => onWindowMaximize(window.id)}>{window.isMaximized ? '❐' : '□'}</button>
              <button onClick={() => onWindowClose(window.id)}>×</button>
            </div>
          </div>
          <div className={styles.windowContent}>
            {window.content}
          </div>
          {!window.isMaximized && (
            <div 
              className={styles.resizeHandle}
              onMouseDown={(e) => {
                e.preventDefault(); // Prevent window selection from triggering
                handleResizeStart(e, window.id);
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default Windows95;