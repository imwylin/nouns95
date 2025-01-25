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
