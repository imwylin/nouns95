import { formatEther } from 'ethers/lib/utils';

// Common contract addresses
export const KNOWN_ADDRESSES = {
  NOUNS_TOKEN: '0x9C8fF314C9Bc7F6e59A9d9225Fb22946427eDC03',
  NOUNS_DAO_PROXY: '0x6f3E6272A167e8AcCb32072d08E0957F9c79223d',
  NOUNS_DAO_EXECUTOR_PROXY: '0xb1a32FC9F9D8b2cf86C068Cae13108809547ef71',
  NOUNS_DAO_LOGIC_V3: '0xeC7A41e49d2AE80A9400d5E8EaF67D6b23D8bC89',
  USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
} as const;

// Known function signatures
export const KNOWN_SIGNATURES: Record<string, string> = {
  // DAO functions
  'propose(address[],uint256[],string[],bytes[],string)': 'Create Proposal',
  'castVote(uint256,uint8)': 'Cast Vote',
  'castVoteWithReason(uint256,uint8,string)': 'Cast Vote with Reason',
  'castRefundableVote(uint256,uint8)': 'Cast Refundable Vote',
  'castRefundableVoteWithReason(uint256,uint8,string)': 'Cast Refundable Vote with Reason',
  'queue(uint256)': 'Queue Proposal',
  'execute(uint256)': 'Execute Proposal',
  'veto(uint256)': 'Veto Proposal',
  'cancel(uint256)': 'Cancel Proposal',
  
  // Token functions
  'transferFrom(address,address,uint256)': 'Transfer Token',
  'delegate(address)': 'Delegate Voting Power',
  'approve(address,uint256)': 'Approve Token Transfer',
  'transfer(address,uint256)': 'Transfer Token',
  
  // Treasury functions
  'withdraw()': 'Withdraw ETH',
  'setVetoer(address)': 'Set Vetoer',
  'burnVetoPower()': 'Burn Veto Power',
  '_setQuorumVotesBPS(uint256)': 'Set Quorum Votes BPS',
  '_setPendingAdmin(address)': 'Set Pending Admin',
  '_acceptAdmin()': 'Accept Admin Role',
};

// Format value based on token type (ETH or USDC)
const formatValue = (value: string, token: string | undefined): string => {
  if (!value || value === '0') return '';

  // USDC has 6 decimals
  if (token === KNOWN_ADDRESSES.USDC) {
    const usdcValue = (parseInt(value) / 1e6).toFixed(2);
    return ` with ${usdcValue} USDC`;
  }

  // ETH has 18 decimals
  return ` with ${formatEther(value)} ETH`;
};

// Helper function to decode and format transaction data
export const getTransactionDescription = (
  target: string,
  signature: string,
  calldata: string,
  value: string
): string => {
  // Check if it's a known target
  const knownTarget = Object.entries(KNOWN_ADDRESSES).find(([_, addr]) => 
    addr.toLowerCase() === target.toLowerCase()
  );
  
  // Get readable signature
  const readableSignature = KNOWN_SIGNATURES[signature] || signature;

  // Determine if this is a USDC transaction
  const isUSDCTarget = target.toLowerCase() === KNOWN_ADDRESSES.USDC.toLowerCase();
  
  // Format the value based on token type
  const formattedValue = formatValue(value, isUSDCTarget ? KNOWN_ADDRESSES.USDC : undefined);

  // Build description
  let description = readableSignature;
  if (knownTarget) {
    description = `${description} on ${knownTarget[0]}`;
  }
  if (formattedValue) {
    description = `${description}${formattedValue}`;
  }

  return description;
};

// Helper function to get a short address display
export const shortenAddress = (address: string): string => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Helper function to format transaction target
export const getTargetName = (target: string): string => {
  const knownTarget = Object.entries(KNOWN_ADDRESSES).find(([_, addr]) => 
    addr.toLowerCase() === target.toLowerCase()
  );
  
  return knownTarget ? knownTarget[0] : shortenAddress(target);
}; 