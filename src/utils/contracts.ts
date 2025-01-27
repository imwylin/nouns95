// Mainnet contract addresses
export const NOUNS_CONTRACTS = {
  TOKEN: '0x9C8fF314C9Bc7F6e59A9d9225Fb22946427eDC03',
  DESCRIPTOR: '0x33a9c445fb4fb21f2c030a6b2d3e2f12d017bfac',
  TREASURY: '0xb1a32FC9F9D8b2cf86C068Cae13108809547ef71',
  Treasury_V1: '0x0BC3807Ec262cB779b38D65b38158acC3bfedE10',
  AUCTION_HOUSE: '0x830BD73E4184ceF73443C15111a1DF14e495C706',
  GOVERNOR: '0x6f3E6272A167e8AcCb32072d08E0957F9c79223d',
  CANDIDATES: '0xf790A5f59678dd733fb3De93493A91f472ca1365',
  Stream_Factory: '0x0fd206FC7A7dBcD5661157eDCb1FFDD0D02A61ff',
  Token_Buyer: '0x4f2acdc74f6941390d9b1804fabc3e780388cfe5',
  USDC_Payer: '0xd97Bcd9f47cEe35c0a9ec1dc40C1269afc9E8E1D',
  SEEDER: '0xCC8a0FB5ab3C7132c1b2A0109142Fb112c4Ce515',
} as const;

// Common token addresses
export const TOKEN_ADDRESSES = {
  USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
} as const;

// Helper function to get contract name from address
export const getContractName = (address: string): string => {
  // Convert to lowercase for comparison
  const targetAddress = address.toLowerCase();

  // Check Nouns contracts
  for (const [name, addr] of Object.entries(NOUNS_CONTRACTS)) {
    if (addr.toLowerCase() === targetAddress) {
      // Format the name: replace underscores with spaces and handle capitalization
      return name.split('_')
        .map(word => {
          // Keep acronyms in all caps
          if (word === word.toUpperCase() && word.length <= 4) {
            return word;
          }
          // Capitalize first letter, lowercase the rest
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(' ');
    }
  }

  // Check token addresses
  for (const [name, addr] of Object.entries(TOKEN_ADDRESSES)) {
    if (addr.toLowerCase() === targetAddress) {
      return name;
    }
  }

  // If no match found, return shortened address
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Contract ABIs
export const VOTE_ABI = [{
  name: 'castRefundableVoteWithReason',
  type: 'function',
  stateMutability: 'nonpayable',
  inputs: [
    { name: 'proposalId', type: 'uint256' },
    { name: 'support', type: 'uint8' },
    { name: 'reason', type: 'string' },
    { name: 'clientId', type: 'uint32' }
  ],
  outputs: []
}] as const;

// Add more ABIs as needed
export const DAO_ABI = [] as const; // TODO: Add DAO ABI
export const TOKEN_ABI = [] as const; // TODO: Add Token ABI
export const AUCTION_HOUSE_ABI = [] as const; // TODO: Add Auction House ABI

// Network configurations
export const NETWORKS = {
  MAINNET: {
    chainId: 1,
    name: 'Ethereum Mainnet',
    rpcUrl: 'https://mainnet.infura.io/v3/your-project-id', // TODO: Add proper RPC URL
    blockExplorer: 'https://etherscan.io',
  },
} as const; 