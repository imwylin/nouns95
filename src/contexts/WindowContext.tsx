import React, { useState, useCallback, createContext } from 'react';

interface Position {
  x: number;
  y: number;
}

interface Window {
  id: string;
  path: string;
  title: string;
  content: React.ReactNode;
  position: Position;
  isMinimized: boolean;
  icon?: string;
}

interface WindowOptions {
  icon?: string;
  position?: Position;
}

interface WindowContextType {
  windows: Window[];
  activeWindowId: string | null;
  openWindow: (path: string, title: string, content: React.ReactNode, options?: WindowOptions) => void;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  bringToFront: (id: string) => void;
  updateWindowPosition: (id: string, position: Position) => void;
}

export const WindowContext = createContext<WindowContextType>({} as WindowContextType);

export const WindowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [windows, setWindows] = useState<Window[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const [nextWindowId, setNextWindowId] = useState(1);

  const openWindow = useCallback((path: string, title: string, content: React.ReactNode, options: WindowOptions = {}) => {
    setWindows(currentWindows => {
      // If this is an Internet Explorer window, check if one already exists
      if (path === '/internet') {
        const existingIEWindow = currentWindows.find(w => w.path === '/internet');
        if (existingIEWindow) {
          // Update the existing window's content with the new URL and bring it to front
          setActiveWindowId(existingIEWindow.id);
          return currentWindows.map(w => 
            w.id === existingIEWindow.id 
              ? { ...w, content, isMinimized: false } 
              : w
          );
        }
      }

      // Calculate position based on window type or use provided position
      let position = options.position;
      if (!position) {
        // Default cascading position for other windows
        position = { x: 20 * (nextWindowId % 10), y: 20 * (nextWindowId % 10) };
      }

      // Create new window
      const newWindow: Window = {
        id: String(nextWindowId),
        path,
        title,
        content,
        position,
        isMinimized: false,
        ...options
      };

      setNextWindowId(prev => prev + 1);
      setActiveWindowId(newWindow.id);
      return [...currentWindows, newWindow];
    });
  }, [nextWindowId]);

  const closeWindow = useCallback((id: string) => {
    setWindows(currentWindows => currentWindows.filter(w => w.id !== id));
  }, []);

  const minimizeWindow = useCallback((id: string) => {
    setWindows(currentWindows => 
      currentWindows.map(w => 
        w.id === id ? { ...w, isMinimized: true } : w
      )
    );
  }, []);

  const maximizeWindow = useCallback((id: string) => {
    setWindows(currentWindows => 
      currentWindows.map(w => 
        w.id === id ? { ...w, isMinimized: false } : w
      )
    );
  }, []);

  const bringToFront = useCallback((id: string) => {
    setActiveWindowId(id);
  }, []);

  const updateWindowPosition = useCallback((id: string, position: Position) => {
    setWindows(currentWindows => 
      currentWindows.map(w => 
        w.id === id ? { ...w, position } : w
      )
    );
  }, []);

  return (
    <WindowContext.Provider value={{
      windows,
      activeWindowId,
      openWindow,
      closeWindow,
      minimizeWindow,
      maximizeWindow,
      bringToFront,
      updateWindowPosition
    }}>
      {children}
    </WindowContext.Provider>
  );
}; 