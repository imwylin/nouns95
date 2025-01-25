import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useBlockNumber, useReadContract, useReadContracts, useWatchContractEvent, usePublicClient, useAccount } from 'wagmi';
import { formatEther, Log } from 'viem';
import { ENSName } from 'react-ens-name';
import { NounsAuctionHouseABI } from '../../abis/NounsAuctionHouse';
import AuctionButton from './AuctionButton';
import classes from './AuctionNoun.module.css';
import { useQuery } from '@apollo/client';
import { GET_AUCTION_BIDS, GET_CURRENT_AUCTION, GET_NOUN_BY_ID, GET_AUCTION_BY_ID } from '../../graphql/queries';
import type { Bid, BidsQueryResponse, Noun } from '../../types/graphql';

const AUCTION_HOUSE_ADDRESS = '0x830BD73E4184ceF73443C15111a1DF14e495C706';

// Add constant for Nounder's address
const NOUNDER_ADDRESS = '0x2573C60a6D127755aA2DC85e342F7da2378a0Cc5';
const FINAL_NOUNDER_NOUN = BigInt(2439);

// Add helper function to check if a Noun is a Nounder Noun
const isNounderNoun = (id: bigint) => {
  // Check if it's every 10th Noun and within the Nounder distribution period
  return Number(id) % 10 === 0 && id <= FINAL_NOUNDER_NOUN;
};

interface AuctionNounProps {
  onColorExtracted: (color: string) => void;
  onNounIdChange: (nounId: bigint) => void;
  extractedColor: string;
}

interface AuctionData {
  nounId: bigint;
  amount: bigint;
  startTime: bigint;
  endTime: bigint;
  bidder: `0x${string}`;
  settled: boolean;
}

interface PastAuctionData {
  blockTimestamp: bigint;
  amount: bigint;
  winner: `0x${string}`;
  nounId: bigint;
  clientId: bigint;
}

const AuctionNoun: React.FC<AuctionNounProps> = ({
  onColorExtracted,
  onNounIdChange,
  extractedColor,
}) => {
  const [nounId, setNounId] = useState<bigint>(BigInt(0));
  const [svg, setSvg] = useState<string | null>(null);
  const [isAuctionNoun, setIsAuctionNoun] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchNounId, setSearchNounId] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [auctionEndTime, setAuctionEndTime] = useState<bigint>(BigInt(0));
  const [auctionNounId, setAuctionNounId] = useState<bigint>(BigInt(0));
  const [isAuctionEnded, setIsAuctionEnded] = useState<boolean>(false);
  const [nextNounId, setNextNounId] = useState<bigint>(BigInt(0));
  
  const publicClient = usePublicClient();
  const { isConnected } = useAccount();

  // Use displayNounId to determine which Noun to show
  const displayNounId = isAuctionEnded ? nextNounId : nounId;

  // Add query for noun data
  const { data: nounData } = useQuery(GET_NOUN_BY_ID, {
    variables: { 
      id: displayNounId.toString()
    },
    skip: !displayNounId,
    pollInterval: 12000
  });

  useEffect(() => {
    console.log('Noun ID:', displayNounId.toString());
    console.log('Noun data:', nounData);
  }, [displayNounId, nounData]);

  const { data: blockNumber } = useBlockNumber({
    watch: true,
    query: {
      refetchInterval: 4000,
    }
  });

  // Add loading state from GraphQL queries
  const { data: currentAuctionGraphQL, loading: currentAuctionLoading } = useQuery(GET_CURRENT_AUCTION, {
    pollInterval: 12000
  });

  // Keep contract data as fallback
  const { data: currentAuctionData, isLoading: isCurrentAuctionLoading } = useReadContract({
    address: AUCTION_HOUSE_ADDRESS,
    abi: NounsAuctionHouseABI,
    functionName: 'auction',
    query: {
      enabled: true,
      refetchInterval: 12000,
      refetchIntervalInBackground: true,
      refetchOnWindowFocus: false,
      staleTime: 11000,
    }
  }) as {
    data: AuctionData | undefined;
    error: Error | null;
    isLoading: boolean;
  };

  // Use GraphQL data first, fall back to contract data
  const currentAuction = currentAuctionGraphQL?.auctions[0] || currentAuctionData;
  const currentNounId = currentAuctionGraphQL?.auctions[0]?.noun?.id 
    ? BigInt(currentAuctionGraphQL.auctions[0].noun.id)
    : currentAuctionData?.nounId;

  useEffect(() => {
    if (currentNounId && isAuctionNoun) {
      setNounId(currentNounId);
      setAuctionNounId(currentNounId);
      onNounIdChange(currentNounId);
    }
  }, [currentNounId, isAuctionNoun, onNounIdChange]);

  const {
    data: pastAuctionData,
    isLoading: isPastAuctionLoading,
  } = useReadContract({
    abi: NounsAuctionHouseABI,
    address: AUCTION_HOUSE_ADDRESS,
    functionName: 'getSettlements',
    args: nounId ? [nounId, nounId + BigInt(1), false] : undefined,
    query: {
      enabled: true,
      refetchInterval: 12000,
      refetchIntervalInBackground: true,
      refetchOnWindowFocus: false,
      staleTime: 11000,
    }
  }) as { data: PastAuctionData[] | undefined, isLoading: boolean };

  // Add this new query for bids
  const { data: bidsData, loading: bidsLoading, error: bidsError } = useQuery<BidsQueryResponse>(GET_AUCTION_BIDS, {
    variables: { 
      auctionId: isAuctionNoun ? currentAuctionGraphQL?.auctions[0]?.id : nounId?.toString()
    },
    skip: isAuctionNoun ? !currentAuctionGraphQL?.auctions[0]?.id : !nounId,
    pollInterval: 12000
  });

  useEffect(() => {
    console.log('Current auction ID:', currentAuctionData?.nounId?.toString());
    console.log('Is auction noun:', isAuctionNoun);
    console.log('Noun ID:', nounId?.toString());
    console.log('Bids loading:', bidsLoading);
    console.log('Bids error:', bidsError);
    console.log('Bids data:', bidsData);
  }, [currentAuctionData?.nounId, isAuctionNoun, nounId, bidsLoading, bidsError, bidsData]);

  const updateTimeLeft = useCallback(() => {
    if (isAuctionNoun && currentAuction) {
      const timer = setInterval(() => {
        const now = Date.now() / 1000;
        const endTime = Number(currentAuction.endTime);
        const diff = endTime - now;
  
        if (diff <= 0) {
          setTimeLeft('Auction ended');
          setIsAuctionEnded(true);
          setNextNounId(BigInt(currentAuction.noun?.id || '0') + BigInt(1));
          if (currentAuction.settled) {
            clearInterval(timer);
          }
        } else {
          setIsAuctionEnded(false);
          const hours = Math.floor(diff / 3600);
          const minutes = Math.floor((diff % 3600) / 60);
          const seconds = Math.floor(diff % 60);
          setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
        }
      }, 1000);
  
      return () => clearInterval(timer);
    }
  }, [isAuctionNoun, currentAuction]);
  
  useEffect(() => {
    const cleanup = updateTimeLeft();
    return () => {
      if (cleanup) cleanup();
    };
  }, [updateTimeLeft]);

  useEffect(() => {
    if (currentAuctionData && 'endTime' in currentAuctionData) {
      const auctionData = currentAuctionData as AuctionData;
      const now = Date.now() / 1000;
      const endTime = Number(auctionData.endTime);
      const diff = endTime - now;
  
      if (diff > 0) {
        setTimeLeft('Calculating...');
        setIsAuctionEnded(false);
      } else {
        setTimeLeft('Auction ended');
        setIsAuctionEnded(true);
        setNextNounId(auctionData.nounId + BigInt(1));
      }
    }
  }, [currentAuctionData]);

  // Convert GraphQL seed to the format expected by the SVG generator
  useEffect(() => {
    if (nounData?.noun?.seed) {
      const graphqlSeed = nounData.noun.seed;
      const convertedSeed = {
        background: Number(graphqlSeed.background),
        body: Number(graphqlSeed.body),
        accessory: Number(graphqlSeed.accessory),
        head: Number(graphqlSeed.head),
        glasses: Number(graphqlSeed.glasses)
      };
      
      const loadBuildSVG = async () => {
        try {
          console.log('Using seed for SVG generation:', convertedSeed);

          const response = await fetch('/api/generateSVG', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ seed: convertedSeed }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
              `Network response was not ok. Status: ${response.status}. Details: ${errorData.error}`
            );
          }

          const data = await response.json();
          setSvg(`data:image/svg+xml;base64,${btoa(data.svg)}`);
          setError(null);
        } catch (err) {
          if (err instanceof Error) {
            setError('Failed to load SVG: ' + err.message);
          } else {
            setError('Failed to load SVG: An unknown error occurred');
          }
        }
      };

      loadBuildSVG();
    }
  }, [nounData?.noun?.seed]);

  useEffect(() => {
    if (svg && canvasRef.current) {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (context) {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          context.drawImage(img, 0, 0);

          // Get the color of the top-left pixel
          const imageData = context.getImageData(0, 0, 1, 1);
          const r = imageData.data[0];
          const g = imageData.data[1];
          const b = imageData.data[2];
          const backgroundColor = `rgb(${r}, ${g}, ${b})`;
          onColorExtracted(backgroundColor);
        };
        img.src = svg;
      }
    }
  }, [svg, onColorExtracted]);

  const handlePrevious = () => {
    setNounId((prevId) => {
      const newId = prevId > BigInt(0) ? prevId - BigInt(1) : BigInt(0);
      onNounIdChange(newId);
      setIsAuctionNoun(false);
      return newId;
    });
  };

  const handleNext = () => {
    setNounId((prevId) => {
      const newId = prevId + BigInt(1);
      if (newId <= auctionNounId) {
        onNounIdChange(newId);
        setIsAuctionNoun(newId === auctionNounId);
        return newId;
      }
      return prevId;
    });
  };

  const handleReset = () => {
    setNounId(auctionNounId);
    setIsAuctionNoun(true);
    onNounIdChange(auctionNounId);
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const id = BigInt(searchNounId);
    setIsAuctionNoun(false);
    setNounId(id);
    onNounIdChange(id);
    setSearchNounId('');
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchNounId(e.target.value);
  };

  // Add query for past auction data
  const { data: pastAuctionGraphQL } = useQuery(GET_AUCTION_BY_ID, {
    variables: { 
      id: !isAuctionNoun ? nounId.toString() : null 
    },
    skip: isAuctionNoun || !nounId,
    pollInterval: 12000
  });

  const renderAuctionInfo = () => {
    if (isAuctionEnded) {
      return (
        <div className={classes.auctionInfo}>
          <h2>Auction Ended</h2>
          <img 
            src="/crystalball.png" 
            alt="Crystal Ball" 
            className={classes.crystalBall}
          />
          <p>Showing prediction for Noun {nextNounId.toString()}</p>
          <p>Settle the auction to start the next one!</p>
        </div>
      );
    }

    if (isAuctionNoun && currentAuction) {
      const bidAmount = currentAuctionGraphQL?.auctions[0]
        ? formatEther(BigInt(currentAuction.amount))
        : formatEther(currentAuction.amount);
      const bidder = currentAuctionGraphQL?.auctions[0]
        ? currentAuction.bidder?.id
        : currentAuction.bidder;

      return (
        <div className={classes.auctionInfo}>
          <h2>Current Auction</h2>
          <p>Time Left: {timeLeft}</p>
          <p>
            Bidder: <ENSName address={bidder} />
          </p>
          <p>High Bid: {bidAmount} Ξ</p>
        </div>
      );
    } else if (Array.isArray(pastAuctionData)) {
      const settlement = pastAuctionData.find((s) => s.nounId === nounId);
      if (settlement) {
        return (
          <div className={classes.auctionInfo}>
            <h2>Past Auction</h2>
            <p>
              Auction Ended:{' '}
              {new Date(
                Number(settlement.blockTimestamp) * 1000
              ).toLocaleString()}
            </p>
            <p>
              Winner: <ENSName address={settlement.winner.toString()} />
            </p>
            <p>Client ID: {settlement.clientId}</p>
            <p>Winning Bid: {formatEther(settlement.amount)} Ξ</p>
          </div>
        );
      } else {
        return (
          <div className={classes.auctionInfo}>
            <h2>No Past Auction Data</h2>
            <p>
              There is no past auction data available for Noun ID{' '}
              {nounId.toString()}.
            </p>
          </div>
        );
      }
    }
    return null;
  };
  
  return (
    <div 
      className={classes.auctionNounWrapper}
      style={{ 
        backgroundColor: extractedColor,
        transition: 'background-color 0.3s ease'
      }}
    >
      <div className={classes.nounContent}>
        {/* Left side - Noun Image */}
        <div className={classes.nounImageSection}>
          <div className={classes.noun}>
            {svg ? (
              <img
                src={svg}
                alt={`Noun ${displayNounId.toString()}`}
                className={classes.nounImage}
              />
            ) : null}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>
        </div>

        {/* Right side - Auction Info */}
        <div className={classes.auctionInfoSection}>
          {/* Navigation */}
          <div className={classes.navigationWrapper}>
            <button
              onClick={handlePrevious}
              className={classes.navButton}
              disabled={nounId === BigInt(0)}
            >
              ←
            </button>
            <span className={classes.date}>
              {new Date().toLocaleDateString('en-US', { 
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
            <button
              onClick={handleNext}
              className={classes.navButton}
              disabled={nounId >= auctionNounId}
            >
              →
            </button>
            <input
              type="number"
              placeholder="Search an ID"
              className={classes.searchInput}
              value={searchNounId}
              onChange={handleSearchChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const id = BigInt(searchNounId || '0');
                  if (id <= auctionNounId) {
                    setIsAuctionNoun(id === auctionNounId);
                    setNounId(id);
                    onNounIdChange(id);
                    setSearchNounId('');
                  }
                }
              }}
              min="0"
              max={auctionNounId.toString()}
            />
            <button
              onClick={handleReset}
              className={classes.currentAuctionButton}
              disabled={isAuctionNoun}
            >
              Current Auction
            </button>
          </div>

          {/* Noun Title */}
          <h1 className={classes.nounTitle}>Noun {displayNounId.toString()}</h1>

          {/* Auction Status Grid */}
          <div className={classes.auctionStatusGrid}>
            <div className={classes.statusItem}>
              <span className={classes.statusLabel}>
                {!isAuctionNoun ? (isNounderNoun(nounId) ? 'Nounder Noun' : 'Winning bid') : 'Current bid'}
              </span>
              <span className={classes.statusValue}>
                <span className={classes.ethSymbol}>Ξ</span>
                {!isAuctionNoun ? (
                  isNounderNoun(nounId) ? 
                    '0' :  // Nounder Nouns have no auction/bid
                    pastAuctionGraphQL?.auction?.amount ? 
                      formatEther(BigInt(pastAuctionGraphQL.auction.amount)) :
                      Array.isArray(pastAuctionData) && pastAuctionData.find((s) => s.nounId === nounId) ? 
                        formatEther(pastAuctionData.find((s) => s.nounId === nounId)!.amount) : 
                        '0'
                ) : (
                  currentAuction ? 
                    formatEther(BigInt(currentAuction.amount)) : 
                    '0'
                )}
              </span>
            </div>
            <div className={classes.statusItem}>
              <span className={classes.statusLabel}>
                {!isAuctionNoun ? (isNounderNoun(nounId) ? 'Sent to' : 'Auction ended') : 'Auction ends in'}
              </span>
              <span className={classes.statusValue}>
                {!isAuctionNoun ? (
                  isNounderNoun(nounId) ? 
                    <ENSName address={NOUNDER_ADDRESS} /> :
                    pastAuctionGraphQL?.auction?.endTime ? 
                      new Date(Number(pastAuctionGraphQL.auction.endTime) * 1000).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      }) :
                      Array.isArray(pastAuctionData) && pastAuctionData.find((s) => s.nounId === nounId) ? 
                        new Date(Number(pastAuctionData.find((s) => s.nounId === nounId)!.blockTimestamp) * 1000).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        }) : 
                        'No data'
                ) : (
                  timeLeft || 'Calculating...'
                )}
              </span>
            </div>
          </div>

          {/* Bidding Section */}
          <div className={classes.biddingSection}>
            <AuctionButton />
          </div>

          {/* Bid History */}
          <div className={classes.bidHistoryContainer}>
            <div className={classes.bidHistoryHeader}>
              Bid History
            </div>
            <div className={classes.bidHistory}>
              {!isAuctionNoun ? (
                isNounderNoun(nounId) ? (
                  // Nounder Noun display
                  <div className={classes.bidItem}>
                    <div className={classes.bidderInfo}>
                      <img 
                        src={`https://cdn.stamp.fyi/avatar/${NOUNDER_ADDRESS}`}
                        alt=""
                        className={classes.avatar}
                      />
                      <div className={classes.bidderDetails}>
                        <ENSName address={NOUNDER_ADDRESS} />
                        <span className={classes.bidTimestamp}>
                          Automatically sent to Nounders
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Past auction data - try GraphQL first, then fall back to contract data
                  pastAuctionGraphQL?.auction ? (
                    <div className={classes.bidItem}>
                      <div className={classes.bidderInfo}>
                        <img 
                          src={`https://cdn.stamp.fyi/avatar/${pastAuctionGraphQL.auction.bids?.[0]?.bidder?.id || pastAuctionGraphQL.auction.bidder?.id}`}
                          alt=""
                          className={classes.avatar}
                        />
                        <div className={classes.bidderDetails}>
                          <ENSName address={pastAuctionGraphQL.auction.bids?.[0]?.bidder?.id || pastAuctionGraphQL.auction.bidder?.id} />
                        </div>
                      </div>
                      <div className={classes.bidAmount}>
                        Ξ {formatEther(BigInt(pastAuctionGraphQL.auction.amount))}
                        <a 
                          href={`https://etherscan.io/address/${pastAuctionGraphQL.auction.bids?.[0]?.bidder?.id || pastAuctionGraphQL.auction.bidder?.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={classes.etherscanLink}
                        >
                          ↗
                        </a>
                      </div>
                    </div>
                  ) : (
                    // Fall back to contract data if no GraphQL data
                    Array.isArray(pastAuctionData) && pastAuctionData.find((s: PastAuctionData) => s.nounId === nounId) && (
                      (() => {
                        const settlement = pastAuctionData.find((s: PastAuctionData) => s.nounId === nounId)!;
                        return (
                          <div className={classes.bidItem}>
                            <div className={classes.bidderInfo}>
                              <img 
                                src={`https://cdn.stamp.fyi/avatar/${settlement.winner}`}
                                alt=""
                                className={classes.avatar}
                              />
                              <div className={classes.bidderDetails}>
                                <ENSName address={settlement.winner} />
                              </div>
                            </div>
                            <div className={classes.bidAmount}>
                              Ξ {formatEther(settlement.amount)}
                              <a 
                                href={`https://etherscan.io/address/${settlement.winner}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={classes.etherscanLink}
                              >
                                ↗
                              </a>
                            </div>
                          </div>
                        );
                      })()
                    )
                  )
                )
              ) : (
                // Current auction bids
                bidsData?.bids?.map((bid: Bid, index: number) => {
                  const bidderId = bid.bidder?.id || '';
                  return (
                    <div key={bid.id} className={classes.bidItem}>
                      <div className={classes.bidderInfo}>
                        <img 
                          src={`https://cdn.stamp.fyi/avatar/${bidderId}`}
                          alt=""
                          className={classes.avatar}
                        />
                        <div className={classes.bidderDetails}>
                          <ENSName address={bidderId} />
                        </div>
                      </div>
                      <div className={classes.bidAmount}>
                        Ξ {bid.amount ? formatEther(BigInt(bid.amount)) : '0'}
                        <a 
                          href={`https://etherscan.io/address/${bidderId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={classes.etherscanLink}
                        >
                          ↗
                        </a>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
      {error && <div className={classes.error}>{error}</div>}
    </div>
  );
}

export default AuctionNoun;