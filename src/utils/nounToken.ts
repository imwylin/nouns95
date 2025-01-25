import { useReadContract, useBlockNumber, usePublicClient } from 'wagmi';
import { keccak256 } from 'viem';
import { useState, useEffect, useRef } from 'react';
import { getNounSeedFromBlockHash } from './nouns-assets-package';

const NOUNS_TOKEN_ADDRESS = '0x9C8fF314C9Bc7F6e59A9d9225Fb22946427eDC03';
const NOUNS_AUCTION_HOUSE_ADDRESS = '0x830BD73E4184ceF73443C15111a1DF14e495C706';

export interface INounSeed {
  accessory: number;
  background: number;
  body: number;
  glasses: number;
  head: number;
}

interface TestModeConfig {
  enabled: boolean;
  mockedBlockHash?: string;
  mockedBlockNumber?: bigint;
}

let testMode: TestModeConfig = {
  enabled: false
};

export const enableTestMode = (blockHash?: string, blockNumber?: bigint) => {
  testMode = {
    enabled: true,
    mockedBlockHash: blockHash || '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    mockedBlockNumber: blockNumber || BigInt(1234567)
  };
};

export const disableTestMode = () => {
  testMode = { enabled: false };
};

const nounsTokenABI = [
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'seeds',
    outputs: [
      { name: 'background', type: 'uint48' },
      { name: 'body', type: 'uint48' },
      { name: 'accessory', type: 'uint48' },
      { name: 'head', type: 'uint48' },
      { name: 'glasses', type: 'uint48' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

const nounsAuctionHouseABI = [
  {
    inputs: [],
    name: 'auction',
    outputs: [
      { name: 'nounId', type: 'uint256' },
      { name: 'amount', type: 'uint256' },
      { name: 'startTime', type: 'uint256' },
      { name: 'endTime', type: 'uint256' },
      { name: 'bidder', type: 'address' },
      { name: 'settled', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export const useNounSeed = (nounId: bigint, isAuctionEnded: boolean = false) => {
  const { data: seedData } = useReadContract({
    address: NOUNS_TOKEN_ADDRESS,
    abi: nounsTokenABI,
    functionName: 'seeds',
    args: [nounId],
    query: {
      enabled: true,
      refetchInterval: 12000,
      refetchIntervalInBackground: true,
      refetchOnWindowFocus: false,
      staleTime: 11000,
    }
  });

  const { data: auctionData } = useReadContract({
    address: NOUNS_AUCTION_HOUSE_ADDRESS,
    abi: nounsAuctionHouseABI,
    functionName: 'auction',
    query: {
      enabled: true,
      refetchInterval: 12000,
      refetchIntervalInBackground: true,
      refetchOnWindowFocus: false,
      staleTime: 11000,
    }
  });

  const publicClient = usePublicClient();
  const { data: blockNumber } = useBlockNumber({
    watch: true,
    query: {
      refetchInterval: 4000,
    }
  });

  const [seed, setSeed] = useState<INounSeed | null>(null);

  useEffect(() => {
    let mounted = true;

    const getSeed = async () => {
      // For existing Nouns, use seed data if available
      if (seedData) {
        console.log('Found seed data:', {
          nounId: nounId.toString(),
          seedData
        });
        const [background, body, accessory, head, glasses] = seedData;
        setSeed({
          background: Number(background),
          body: Number(body),
          accessory: Number(accessory),
          head: Number(head),
          glasses: Number(glasses),
        });
        return;
      }

      // Only need auction data for predictions
      if (!auctionData?.[0]) {
        console.log('No auction data yet');
        return;
      }

      const currentAuctionId = auctionData[0];
      const nextNounId = currentAuctionId + BigInt(1);

      // If this is the next Noun and auction is ended, predict
      if (nounId === nextNounId && isAuctionEnded) {
        if (!publicClient || !blockNumber) {
          console.log('Waiting for blockchain connection');
          return;
        }

        try {
          const block = await publicClient.getBlock({ blockNumber });
          if (!block.hash) throw new Error('No block hash available');
          if (!mounted) return;

          console.log('Predicting next Noun:', {
            currentAuctionId: currentAuctionId.toString(),
            nextId: nounId.toString(),
            blockHash: block.hash,
            testMode: testMode.enabled
          });

          const hashToUse = testMode.enabled ? testMode.mockedBlockHash! : block.hash;
          const predictedSeed = getNounSeedFromBlockHash(Number(nounId), hashToUse);
          
          console.log('Predicted seed:', predictedSeed);
          setSeed(predictedSeed);
        } catch (error) {
          console.error('Error predicting next Noun:', error);
          if (mounted) setSeed(null);
        }
      }
    };

    getSeed();
    return () => { mounted = false; };
  }, [seedData, blockNumber, nounId, publicClient, auctionData, isAuctionEnded]);

  return seed;
};

export const getNounImageUrl = (nounId: bigint, seed: INounSeed) => {
  const seedParam = encodeURIComponent(JSON.stringify(seed));
  return `/api/getNounSvg?seed=${seedParam}`;
};

export const getNoun = (nounId: bigint, seed: INounSeed) => {
  const id = nounId.toString();
  const name = `Noun ${id}`;
  const description = `Noun ${id} is a member of the Nouns DAO`;
  const image = getNounImageUrl(nounId, seed);

  return {
    name,
    description,
    image,
  };
};