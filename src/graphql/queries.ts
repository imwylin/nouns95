import { gql } from '@apollo/client';

export const GET_CURRENT_AUCTION = gql`
  query GetCurrentAuction {
    auctions(
      first: 1,
      orderBy: startTime,
      orderDirection: desc,
      where: { settled: false }
    ) {
      id
      amount
      startTime
      endTime
      settled
      bidder {
        id
        delegate {
          id
          delegatedVotes
        }
      }
      noun {
        id
        seed {
          background
          body
          accessory
          head
          glasses
        }
        owner {
          id
          delegate {
            id
            delegatedVotes
          }
        }
      }
    }
  }
`;

export const GET_AUCTION_BIDS = gql`
  query GetAuctionBids($auctionId: String!) {
    bids(
      first: 3,
      orderBy: blockNumber,
      orderDirection: desc,
      where: { auction_: { id: $auctionId } }
    ) {
      id
      amount
      blockNumber
      bidder {
        id
      }
    }
  }
`;

export const GET_AUCTION_BY_ID = gql`
  query GetAuctionById($id: ID!) {
    auction(id: $id) {
      id
      amount
      startTime
      endTime
      settled
      bidder {
        id
      }
      noun {
        id
        seed {
          background
          body
          accessory
          head
          glasses
        }
      }
      bids(orderBy: amount, orderDirection: desc, first: 1) {
        id
        amount
        blockNumber
        blockTimestamp
        bidder {
          id
        }
      }
    }
  }
`;

export const GET_RECENT_AUCTIONS = gql`
  query GetRecentAuctions($first: Int!) {
    auctions(
      first: $first,
      orderBy: startTime,
      orderDirection: desc,
      where: { settled: true }
    ) {
      id
      amount
      startTime
      endTime
      settled
      bidder {
        id
        delegate {
          id
          delegatedVotes
        }
      }
      noun {
        id
        seed {
          background
          body
          accessory
          head
          glasses
        }
        owner {
          id
          delegate {
            id
            delegatedVotes
          }
        }
      }
      bids(orderBy: timestamp, orderDirection: desc) {
        id
        amount
        bidder {
          id
          delegate {
            id
            delegatedVotes
          }
        }
        timestamp
      }
    }
  }
`;

export const GET_ACCOUNT_INFO = gql`
  query GetAccountInfo($id: ID!) {
    account(id: $id) {
      id
      nouns {
        id
        seed {
          background
          body
          accessory
          head
          glasses
        }
      }
      delegate {
        id
        delegatedVotes
        tokenHoldersRepresented {
          id
        }
      }
      votes {
        id
        support
        votes
        proposal {
          id
          title
          status
        }
      }
    }
  }
`;

export const GET_PROPOSALS = gql`
  query GetProposals($first: Int!, $skip: Int!) {
    proposals(
      first: $first,
      skip: $skip,
      orderBy: createdTimestamp,
      orderDirection: desc
    ) {
      id
      proposer {
        id
      }
      title
      status
      quorumVotes
      proposalThreshold
      executionETA
      votes {
        id
        support
        votes
        voter {
          id
        }
      }
      proposalVersions(orderBy: version, orderDirection: desc, first: 1) {
        id
        description
        targets
        values
        signatures
        calldatas
      }
    }
  }
`;

export const GET_PROPOSAL_CANDIDATES = gql`
  query GetProposalCandidates($first: Int!, $skip: Int!) {
    proposalCandidates(
      first: $first,
      skip: $skip,
      orderBy: createdAt,
      orderDirection: desc
    ) {
      id
      proposer {
        id
      }
      latestVersion {
        content {
          title
          description
          targets
          values
          signatures
          calldatas
        }
      }
      signers {
        id
        signer {
          id
        }
        signature
      }
      feedback {
        id
        supporter {
          id
        }
        support
        reason
      }
    }
  }
`;

export const GET_NOUN_BY_ID = gql`
  query GetNounById($id: ID!) {
    noun(id: $id) {
      id
      seed {
        background
        body
        accessory
        head
        glasses
      }
      owner {
        id
      }
    }
  }
`;

export const GET_PROPOSAL_FEEDBACK = gql`
  query GetProposalFeedback($id: ID!) {
    proposalFeedback(
      id: $id
      subgraphError: deny
    ) {
      id
      proposal {
        id
      }
      supportDetailed
      votes
      reason
      createdTimestamp
      voter {
        id
      }
    }
  }
`;

export const GET_PROPOSAL_FEEDBACKS = gql`
  query GetProposalFeedbacks(
    $first: Int = 100
    $skip: Int = 0
    $orderBy: ProposalFeedback_orderBy
    $orderDirection: OrderDirection
    $where: ProposalFeedback_filter
  ) {
    proposalFeedbacks(
      first: $first
      skip: $skip
      orderBy: $orderBy
      orderDirection: $orderDirection
      where: $where
      subgraphError: deny
    ) {
      id
      proposal {
        id
      }
      supportDetailed
      votes
      reason
      createdTimestamp
      voter {
        id
      }
    }
  }
`;

export const GET_VOTES = gql`
  query GetVotes(
    $skip: Int = 0
    $first: Int = 100
    $orderBy: Vote_orderBy
    $orderDirection: OrderDirection
    $where: Vote_filter
    $block: Block_height
  ) {
    votes(
      skip: $skip
      first: $first
      orderBy: $orderBy
      orderDirection: $orderDirection
      where: $where
      block: $block
      subgraphError: deny
    ) {
      id
      proposal {
        id
      }
      support
      votes
      reason
      blockTimestamp
      voter {
        id
      }
    }
  }
`;

export const GET_PROPOSALS_FEED = gql`
  query GetProposalsFeed(
    $skip: Int = 0
    $first: Int = 100
    $orderBy: Proposal_orderBy
    $orderDirection: OrderDirection
    $where: Proposal_filter
    $block: Block_height
  ) {
    proposals(
      skip: $skip
      first: $first
      orderBy: $orderBy
      orderDirection: $orderDirection
      where: $where
      block: $block
      subgraphError: deny
    ) {
      id
      title
      status
      proposer {
        id
      }
      createdTimestamp
      startBlock
      endBlock
      forVotes
      againstVotes
      quorumVotes
      proposalThreshold
    }
  }
`;

export const GET_PROPOSAL_BY_ID = gql`
  query GetProposalById($id: ID!) {
    proposal(id: $id) {
      id
      title
      description
      proposer {
        id
      }
      status
      createdTimestamp
      startBlock
      endBlock
      forVotes
      againstVotes
      abstainVotes
      quorumVotes
      proposalThreshold
      totalSupply
      adjustedTotalSupply
      executionETA
      voteSnapshotBlock
      clientId
      votes(orderBy: blockTimestamp, orderDirection: desc) {
        id
        voter {
          id
        }
        support
        votes
        reason
        blockTimestamp
      }
      feedbackPosts(orderBy: createdTimestamp, orderDirection: desc) {
        id
        voter {
          id
        }
        supportDetailed
        votes
        reason
        createdTimestamp
      }
    }
  }
`; 