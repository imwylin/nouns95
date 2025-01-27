import { useState, useCallback, useEffect } from 'react';
import type { NextPage } from 'next';
import styles from '../styles/Home.module.css';
import AuctionNoun from '../components/AuctionNoun/AuctionNoun';
import Desktop from '../components/Desktop/Desktop';
import Windows95 from '../components/Windows95/Windows95';
import Taskbar from '../components/Taskbar/Taskbar';

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

const Home: NextPage = () => {
  const [backgroundColor, setBackgroundColor] = useState<string>('white');
  const [currentNounId, setCurrentNounId] = useState<bigint>(BigInt(0));
  const [extractedColor, setExtractedColor] = useState<string>('white');
  const [activeWindows, setActiveWindows] = useState<Window[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [nextZIndex, setNextZIndex] = useState(1);

  const handleNounIdChange = useCallback((nounId: bigint) => {
    setCurrentNounId(nounId);
  }, []);

  const handleColorExtracted = (color: string) => {
    setBackgroundColor(color);
    setExtractedColor(color);
  };

  // Add mobile detection
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);

    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const openWindow = useCallback((id: string, title: string, content: React.ReactNode) => {
    setActiveWindows(prev => {
      const existingWindow = prev.find(w => w.id === id);
      if (existingWindow) {
        return prev.map(w => w.id === id ? { ...w, isMinimized: false, zIndex: nextZIndex } : w);
      }
      
      // Set icon based on window type
      let icon = '/nouns95.png';
      let size = { width: 200, height: 150 };
      
      if (id === '/studio') {
        icon = '/studio.png';
        size = { width: 1024, height: 768 };
      } else if (id === '/' || id === '/auction') {
        icon = '/auction.png';
        size = { width: 600, height: 650 };
      } else if (id === '/governance') {
        icon = '/governance.png';
        size = { width: 800, height: 600 };
      }
      
      return [...prev, { 
        id, 
        title, 
        content, 
        isMinimized: false, 
        isMaximized: false, 
        zIndex: nextZIndex,
        icon,
        size,
        position: {
          x: 50 + (prev.length * 20),
          y: 50 + (prev.length * 20)
        }
      }];
    });
    setNextZIndex(z => z + 1);
  }, [nextZIndex]);

  const closeWindow = useCallback((id: string) => {
    setActiveWindows(prev => prev.filter(w => w.id !== id));
  }, []);

  const minimizeWindow = useCallback((id: string) => {
    setActiveWindows(prev => prev.map(w => w.id === id ? { ...w, isMinimized: !w.isMinimized } : w));
  }, []);

  const maximizeWindow = useCallback((id: string) => {
    setActiveWindows(prev => prev.map(w => w.id === id ? { ...w, isMaximized: !w.isMaximized } : w));
  }, []);

  const selectWindow = useCallback((id: string) => {
    setActiveWindows(prev => {
      const window = prev.find(w => w.id === id);
      if (!window) return prev;
      return prev.map(w => ({
        ...w,
        isMinimized: w.id === id ? false : w.isMinimized,
        zIndex: w.id === id ? nextZIndex : w.zIndex
      }));
    });
    setNextZIndex(z => z + 1);
  }, [nextZIndex]);

  const moveWindow = useCallback((id: string, position: { x: number; y: number }, size?: { width: number; height: number }) => {
    setActiveWindows(prev => prev.map(w => w.id === id ? { 
      ...w, 
      position,
      size: size || w.size
    } : w));
  }, []);

  return (
    <div style={{ 
      height: '100vh', 
      width: '100vw',
      overflow: 'hidden',
      backgroundImage: 'url(/clouds.png)',
      backgroundSize: '100% 100%',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      position: 'fixed',
      top: 0,
      left: 0
    }}>
      <Desktop openWindow={openWindow} isMobile={isMobile} />
      <Windows95 
        activeWindows={activeWindows}
        onWindowClose={closeWindow}
        onWindowMinimize={minimizeWindow}
        onWindowMaximize={maximizeWindow}
        onWindowSelect={selectWindow}
        onWindowMove={moveWindow}
      />
      <Taskbar 
        activeWindows={activeWindows}
        onWindowSelect={selectWindow}
        openWindow={openWindow}
      />
      <main className={styles.main}>
        <AuctionNoun
          onColorExtracted={handleColorExtracted}
          onNounIdChange={handleNounIdChange}
          extractedColor={extractedColor}
        />
        <section className={styles.infoSection}>
          <div className={styles.infoContent}>
            <p>
              Nouns is an infinite work of art (one Noun, everyday, forever) and community-owned brand that makes a positive impact by funding ideas and fostering collaboration. <br />
              From collectors and technologists, to non-profits and brands, Nouns is for everyone!
            </p>
            <p>
              The videos below will give you a good idea of what Nouns is and how it works:
            </p>
            <div className={styles.videoContainer}>
              <div className={styles.videoWrapper}>
                <iframe 
                  src="https://www.youtube.com/embed/lOzCA7bZG_k?si=xShZbJ3BgVq9i7WH" 
                  title="YouTube video player" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                  referrerPolicy="strict-origin-when-cross-origin" 
                  allowFullScreen
                />
              </div>
              <div className={styles.videoWrapper}>
                <iframe 
                  src="https://www.youtube.com/embed/LNR1TIxNjvs?si=rvn6AWW44WUH5Cne" 
                  title="YouTube video player" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                  referrerPolicy="strict-origin-when-cross-origin" 
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home;
