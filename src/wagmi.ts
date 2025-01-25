import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet } from 'viem/chains';
import { http } from 'wagmi';

if (!process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID) {
  throw new Error('Missing NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID');
}

if (!process.env.NEXT_PUBLIC_INFURA_API_KEY) {
  throw new Error('Missing NEXT_PUBLIC_INFURA_API_KEY');
}

export const config = getDefaultConfig({
  appName: 'Nouns Classic',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID,
  chains: [mainnet],
  transports: {
    [mainnet.id]: http(`https://mainnet.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_API_KEY}`)
  },
  ssr: true,
});