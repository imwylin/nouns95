import { useState, useCallback } from 'react';
import type { NextPage } from 'next';
import styles from '../styles/Home.module.css';
import AuctionNoun from '../components/AuctionNoun/AuctionNoun';

const Home: NextPage = () => {
  const [backgroundColor, setBackgroundColor] = useState<string>('white');
  const [currentNounId, setCurrentNounId] = useState<bigint>(BigInt(0));
  const [extractedColor, setExtractedColor] = useState<string>('white');

  const handleNounIdChange = useCallback((nounId: bigint) => {
    setCurrentNounId(nounId);
  }, []);

  const handleColorExtracted = (color: string) => {
    setBackgroundColor(color);
    setExtractedColor(color);
  };

  return (
    <div 
      className={styles.pageWrapper}
      style={{ backgroundColor }}
    >
      <main className={styles.main}>
        <AuctionNoun
          onColorExtracted={handleColorExtracted}
          onNounIdChange={handleNounIdChange}
          extractedColor={extractedColor}
        />
      </main>
    </div>
  );
};

export default Home;
