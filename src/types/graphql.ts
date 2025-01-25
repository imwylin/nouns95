export interface Delegate {
  id: string;
  delegatedVotes: string;
  tokenHoldersRepresented?: Array<{
    id: string;
  }>;
}

export interface Account {
  id: string;
  delegate?: Delegate;
  nouns: Array<Noun>;
  votes: Array<Vote>;
}

export interface Vote {
  id: string;
  support: boolean;
  votes: string;
  voter?: {
    id: string;
  };
  proposal?: {
    id: string;
    title: string;
    status: string;
  };
}

export interface Bid {
  id: string;
  amount: string;
  blockNumber: string;
  block?: {
    timestamp: string;
  };
  bidder?: {
    id: string;
    delegate?: {
      id: string;
      delegatedVotes: string;
    };
  };
  auction?: {
    id: string;
  };
}

export interface Auction {
  id: string;
  noun: {
    id: string;
    seed: {
      background: number;
      body: number;
      accessory: number;
      head: number;
      glasses: number;
    };
    owner?: {
      id: string;
      delegate?: Delegate;
    };
  };
  amount: string;
  startTime: string;
  endTime: string;
  settled: boolean;
  bidder: {
    id: string;
    delegate?: Delegate;
  };
  bids: Array<Bid>;
}

export interface Noun {
  id: string;
  seed: {
    background: number;
    body: number;
    accessory: number;
    head: number;
    glasses: number;
  };
  owner: {
    id: string;
    delegate?: Delegate;
  };
  auction?: Auction;
}

export interface ProposalVersion {
  id: string;
  description: string;
  targets: string[];
  values: string[];
  signatures: string[];
  calldatas: string[];
}

export interface Proposal {
  id: string;
  proposer: {
    id: string;
  };
  title: string;
  status: string;
  quorumVotes: string;
  proposalThreshold: string;
  executionETA: string;
  votes: Array<Vote>;
  proposalVersions: Array<ProposalVersion>;
}

export interface ProposalCandidate {
  id: string;
  proposer: {
    id: string;
  };
  latestVersion: {
    content: {
      title: string;
      description: string;
      targets: string[];
      values: string[];
      signatures: string[];
      calldatas: string[];
    };
  };
  signers: Array<{
    id: string;
    signer: {
      id: string;
    };
    signature: string;
  }>;
  feedback: Array<{
    id: string;
    supporter: {
      id: string;
    };
    support: boolean;
    reason: string;
  }>;
}

export interface AuctionsQueryResponse {
  auctions: Auction[];
}

export interface SingleAuctionQueryResponse {
  auction: Auction;
}

export interface AccountQueryResponse {
  account: Account;
}

export interface ProposalsQueryResponse {
  proposals: Proposal[];
}

export interface ProposalCandidatesQueryResponse {
  proposalCandidates: ProposalCandidate[];
}

export interface BidsQueryResponse {
  bids: Bid[];
} 