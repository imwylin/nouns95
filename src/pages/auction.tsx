import type { NextPage } from 'next';
import { useState } from 'react';
import NavBar from '../components/NavBar/NavBar';
import Footer from '../components/Footer/Footer';
import AuctionNoun from '../components/AuctionNoun/AuctionNoun';
import styles from '../styles/Auction.module.css';

const Auction: NextPage = () => {
  const [extractedColor, setExtractedColor] = useState<string>('#000000');
  const [currentNounId, setCurrentNounId] = useState<bigint>(BigInt(0));

  const handleColorExtracted = (color: string) => {
    setExtractedColor(color);
  };

  const handleNounIdChange = (nounId: bigint) => {
    setCurrentNounId(nounId);
  };

  return (
    <div className={styles.container}>
      <NavBar />
      <main className={styles.main}>
        <AuctionNoun 
          onColorExtracted={handleColorExtracted}
          onNounIdChange={handleNounIdChange}
          extractedColor={extractedColor}
        />
      </main>
      <Footer />
    </div>
  );
};

export default Auction; 