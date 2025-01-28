import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from '../styles/Internet.module.css';
import Image from 'next/image';

interface InternetContentProps {
  url: string;
}

export const InternetContent: React.FC<InternetContentProps> = ({ url: initialUrl }) => {
  const [url, setUrl] = useState(initialUrl || 'https://www.google.com');
  const [inputUrl, setInputUrl] = useState(initialUrl || 'https://www.google.com');
  const [isLoading, setIsLoading] = useState(false);
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
    let processedUrl = targetUrl;
    
    // Add https:// if no protocol is specified
    if (!processedUrl.match(/^https?:\/\//i)) {
      processedUrl = 'https://' + processedUrl;
    }

    try {
      // Validate URL
      new URL(processedUrl);
      
      setError(null);
      setIsLoading(true);
      setUrl(processedUrl);
      setInputUrl(processedUrl);
      
      // Update history
      if (currentIndex.current < history.current.length - 1) {
        // If we're not at the end of history, remove future entries
        history.current = history.current.slice(0, currentIndex.current + 1);
      }
      history.current.push(processedUrl);
      currentIndex.current = history.current.length - 1;
      
      // Update iframe src to use our proxy
      if (iframeRef.current) {
        iframeRef.current.src = `/api/proxy?url=${encodeURIComponent(processedUrl)}`;
      }
    } catch (e) {
      setError('Invalid URL. Please check the address and try again.');
      setIsLoading(false);
    }
  }, []);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      navigateToUrl(inputUrl);
    }
  };

  const handleNavigation = (action: 'back' | 'forward' | 'refresh' | 'home') => {
    if (action === 'back' && currentIndex.current > 0) {
      currentIndex.current--;
      const previousUrl = history.current[currentIndex.current];
      navigateToUrl(previousUrl);
    } else if (action === 'forward' && currentIndex.current < history.current.length - 1) {
      currentIndex.current++;
      const nextUrl = history.current[currentIndex.current];
      navigateToUrl(nextUrl);
    } else if (action === 'refresh') {
      navigateToUrl(url);
    } else if (action === 'home') {
      navigateToUrl('https://www.google.com');
    }
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setError('The page failed to load. Please check the URL and try again.');
    setIsLoading(false);
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
          {isLoading && (
            <div className={styles.loadingIndicator}>
              <Image src="/loading.gif" alt="Loading" width={16} height={16} />
            </div>
          )}
        </div>
      </div>
      <div className={styles.content}>
        {error ? (
          <div className={styles.error}>
            <Image src="/error.png" alt="Error" width={32} height={32} />
            <div className={styles.errorMessage}>
              <h3>Internet Explorer cannot display the webpage</h3>
              <p>{error}</p>
            </div>
          </div>
        ) : (
          <iframe 
            ref={iframeRef}
            title="Internet Explorer"
            className={styles.iframe}
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          />
        )}
      </div>
    </div>
  );
}

const InternetPage = () => {
  return <InternetContent url="" />;
};

export default InternetPage; 