import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from '../styles/Internet.module.css';
import Image from 'next/image';

interface InternetContentProps {
  url: string;
}

export const InternetContent: React.FC<InternetContentProps> = ({ url: initialUrl }) => {
  const [url, setUrl] = useState(initialUrl);
  const [inputUrl, setInputUrl] = useState(initialUrl);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const history = useRef<string[]>([]);
  const currentIndex = useRef<number>(-1);

  useEffect(() => {
    if (initialUrl) {
      navigateToUrl(initialUrl);
    }
  }, [initialUrl]);

  const navigateToUrl = useCallback((targetUrl: string) => {
    setError(null);
    setUrl(targetUrl);
    setInputUrl(targetUrl);
    
    // Update history
    if (currentIndex.current < history.current.length - 1) {
      // If we're not at the end of history, remove future entries
      history.current = history.current.slice(0, currentIndex.current + 1);
    }
    history.current.push(targetUrl);
    currentIndex.current = history.current.length - 1;
    
    // Update iframe src to use our proxy
    if (iframeRef.current) {
      iframeRef.current.src = `/api/proxy?url=${encodeURIComponent(targetUrl)}`;
    }
  }, []);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      let newUrl = inputUrl;
      if (!newUrl.startsWith('http://') && !newUrl.startsWith('https://')) {
        newUrl = 'https://' + newUrl;
      }
      navigateToUrl(newUrl);
    }
  };

  const handleNavigation = (action: 'back' | 'forward' | 'refresh' | 'home') => {
    if (action === 'back' && currentIndex.current > 0) {
      currentIndex.current--;
      const previousUrl = history.current[currentIndex.current];
      setUrl(previousUrl);
      setInputUrl(previousUrl);
      if (iframeRef.current) {
        iframeRef.current.src = `/api/proxy?url=${encodeURIComponent(previousUrl)}`;
      }
    } else if (action === 'forward' && currentIndex.current < history.current.length - 1) {
      currentIndex.current++;
      const nextUrl = history.current[currentIndex.current];
      setUrl(nextUrl);
      setInputUrl(nextUrl);
      if (iframeRef.current) {
        iframeRef.current.src = `/api/proxy?url=${encodeURIComponent(nextUrl)}`;
      }
    } else if (action === 'refresh') {
      navigateToUrl(url);
    } else if (action === 'home') {
      navigateToUrl('https://www.google.com');
    }
  };

  const handleIframeError = () => {
    setError('The page failed to load. Please check the URL and try again.');
  };

  // Handle messages from the proxy
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'navigate') {
        navigateToUrl(event.data.url);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [navigateToUrl]);

  return (
    <div className={styles.internet}>
      <div className={styles.toolbar}>
        <div className={styles.navigationBar}>
          <button 
            className={styles.navButton} 
            onClick={() => handleNavigation('back')}
            disabled={currentIndex.current <= 0}
            title="Back"
          >
            <Image src="/back.png" alt="Back" width={16} height={16} />
          </button>
          <button 
            className={styles.navButton} 
            onClick={() => handleNavigation('forward')}
            disabled={currentIndex.current >= history.current.length - 1}
            title="Forward"
          >
            <Image src="/forward.png" alt="Forward" width={16} height={16} />
          </button>
          <button 
            className={styles.navButton} 
            onClick={() => handleNavigation('refresh')}
            title="Refresh"
          >
            <Image src="/refresh.png" alt="Refresh" width={16} height={16} />
          </button>
          <button 
            className={styles.navButton} 
            onClick={() => handleNavigation('home')}
            title="Home"
          >
            <Image src="/home.png" alt="Home" width={16} height={16} />
          </button>
        </div>
        <div className={styles.addressBar}>
          <span className={styles.addressLabel}>Address:</span>
          <input
            type="text"
            className={styles.addressInput}
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            onKeyPress={handleKeyPress}
          />
        </div>
      </div>
      <div className={styles.content}>
        {error && (
          <div className={styles.error}>
            <Image src="/error.png" alt="Error" width={32} height={32} />
            <div className={styles.errorMessage}>
              <h3>Internet Explorer cannot display the webpage</h3>
              <p>{error}</p>
            </div>
          </div>
        )}
        <iframe 
          ref={iframeRef}
          title="Internet Explorer"
          className={styles.iframe}
          onError={handleIframeError}
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads allow-modals allow-orientation-lock allow-pointer-lock allow-presentation allow-top-navigation"
        />
      </div>
    </div>
  );
}

const InternetPage = () => {
  return <InternetContent url="" />;
};

export default InternetPage; 