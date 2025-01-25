import { useState } from 'react';
import type { NextPage } from 'next';
import Link from 'next/link';
import { useQuery } from '@apollo/client';
import { ENSName } from 'react-ens-name';
import { useBlockNumber } from 'wagmi';
import styles from '../styles/governance.module.css';
import { GET_PROPOSAL_FEEDBACKS, GET_VOTES, GET_PROPOSALS_FEED } from '../graphql/queries';

interface ProposalFeedback {
  id: string;
  proposal: {
    id: string;
  };
  supportDetailed: number;
  votes: string;
  reason: string;
  createdTimestamp: string;
  voter: {
    id: string;
  };
}

interface Vote {
  id: string;
  proposal: {
    id: string;
  };
  support: boolean;
  votes: string;
  reason: string;
  blockTimestamp: string;
  voter: {
    id: string;
  };
}

interface FeedItem {
  id: string;
  type: 'signal' | 'vote';
  proposal: {
    id: string;
  };
  support: number | boolean;
  votes: string;
  reason: string;
  timestamp: string;
  voter: {
    id: string;
  };
}

interface Proposal {
  id: string;
  title: string;
  status: string;
  proposer: {
    id: string;
  };
  createdTimestamp: string;
  startBlock: string;
  endBlock: string;
  quorumVotes: string;
  proposalThreshold: string;
  forVotes?: string;
  againstVotes?: string;
}

const GovernancePage: NextPage = () => {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'votes' | 'proposals'>('votes');
  const { data: blockNumber } = useBlockNumber({ watch: true });

  const { loading: loadingSignals, error: signalsError, data: signalsData } = useQuery(GET_PROPOSAL_FEEDBACKS, {
    variables: {
      first: 100,
      skip: 0,
      orderBy: 'createdTimestamp',
      orderDirection: 'desc'
    }
  });

  const { loading: loadingVotes, error: votesError, data: votesData } = useQuery(GET_VOTES, {
    variables: {
      skip: 0,
      first: 100,
      orderBy: 'blockTimestamp',
      orderDirection: 'desc',
      where: undefined,
      block: undefined
    }
  });

  const { loading: loadingProposals, error: proposalsError, data: proposalsData } = useQuery(GET_PROPOSALS_FEED, {
    variables: {
      skip: 0,
      first: 100,
      orderBy: 'createdTimestamp',
      orderDirection: 'desc',
      where: {
        status_not: null
      }
    },
    pollInterval: 10000,
    fetchPolicy: 'network-only'
  });

  const getSupportType = (support: number | boolean, isVote: boolean) => {
    if (isVote) {
      return support ? 'For' : 'Against';
    }
    switch (support as number) {
      case 0:
        return 'Against';
      case 1:
        return 'For';
      case 2:
        return 'Abstain';
      default:
        return 'Unknown';
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(parseInt(timestamp) * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Combine and sort signals and votes
  const feedItems: FeedItem[] = [
    ...(signalsData?.proposalFeedbacks || []).map((feedback: ProposalFeedback) => ({
      ...feedback,
      type: 'signal' as const,
      support: feedback.supportDetailed,
      timestamp: feedback.createdTimestamp
    })),
    ...(votesData?.votes || []).map((vote: Vote) => ({
      ...vote,
      type: 'vote' as const,
      support: vote.support,
      timestamp: vote.blockTimestamp
    }))
  ].sort((a, b) => parseInt(b.timestamp) - parseInt(a.timestamp));

  const loading = loadingSignals || loadingVotes || loadingProposals;
  const error = signalsError || votesError || proposalsError;

  const getProposalStatus = (proposal: Proposal) => {
    // If the status is anything other than ACTIVE, return it as is
    if (proposal.status !== 'ACTIVE') {
      return proposal.status;
    }

    // Use actual block number from chain if available
    const currentBlock = blockNumber || Math.floor(Date.now() / 1000 / 12);
    const startBlock = parseInt(proposal.startBlock);
    const endBlock = parseInt(proposal.endBlock);

    console.log('Proposal', proposal.id, {
      currentBlock,
      startBlock,
      endBlock,
      forVotes: proposal.forVotes,
      againstVotes: proposal.againstVotes,
      quorumVotes: proposal.quorumVotes,
      isActive: currentBlock >= startBlock && currentBlock <= endBlock
    });

    // If we haven't reached the start block or we're before the end block, it's active
    if (currentBlock >= startBlock && currentBlock <= endBlock) {
      return 'ACTIVE';
    }

    // Only check defeat conditions after voting has ended
    if (currentBlock > endBlock) {
      const forVotes = parseInt(proposal.forVotes || '0');
      const againstVotes = parseInt(proposal.againstVotes || '0');
      const quorumVotes = parseInt(proposal.quorumVotes || '0');

      // Proposal is defeated if:
      // 1. FOR votes don't meet quorum OR
      // 2. AGAINST votes are greater than or equal to FOR votes
      if (forVotes < quorumVotes || againstVotes >= forVotes) {
        return 'DEFEATED';
      }
    }

    return proposal.status;
  };

  return (
    <div className={styles.pageWrapper}>
      <main className={styles.main}>
        <div className={styles.governanceContainer}>
          <div className={styles.mobileTabs}>
            <button 
              className={`${styles.mobileTab} ${activeTab === 'votes' ? styles.active : ''}`}
              onClick={() => setActiveTab('votes')}
            >
              Votes & Signals
            </button>
            <button 
              className={`${styles.mobileTab} ${activeTab === 'proposals' ? styles.active : ''}`}
              onClick={() => setActiveTab('proposals')}
            >
              Proposals
            </button>
          </div>

          <div className={`${styles.feedSection} ${activeTab === 'votes' ? styles.active : ''}`}>
            <h1 className={styles.title}>Votes & Signals</h1>
            
            {loading && <div className={styles.loading}>Loading data...</div>}
            {error && <div className={styles.error}>Error: {error.message}</div>}
            
            <div className={styles.feedbackList}>
              {feedItems.map((item) => (
                <div 
                  key={item.id} 
                  className={styles.feedbackItem}
                  onClick={() => setSelectedItem(selectedItem === item.id ? null : item.id)}
                >
                  <div className={styles.feedbackHeader}>
                    <div className={styles.voterInfo}>
                      <img 
                        src={`https://cdn.stamp.fyi/avatar/${item.voter.id}`}
                        alt=""
                        className={styles.avatar}
                      />
                      <ENSName address={item.voter.id} />
                      <Link 
                        href={`/proposal/${item.proposal.id}`}
                        className={styles.proposalId}
                        onClick={(e) => e.stopPropagation()}
                      >
                        Proposal {item.proposal.id}
                      </Link>
                    </div>
                    <div className={styles.feedbackMeta}>
                      <span className={styles.support}>
                        {item.type === 'signal' ? 'Signaled' : 'Voted'} {getSupportType(item.support, item.type === 'vote')}
                      </span>
                      <span className={styles.votes}>
                        {parseInt(item.votes)} {parseInt(item.votes) === 1 ? 'vote' : 'votes'}
                      </span>
                      <span className={styles.timestamp}>
                        {formatDate(item.timestamp)}
                      </span>
                    </div>
                  </div>
                  
                  {selectedItem === item.id && item.reason && (
                    <div className={styles.feedbackReason}>
                      <p>{item.reason || 'No reason provided'}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className={`${styles.proposalsSection} ${activeTab === 'proposals' ? styles.active : ''}`}>
            <h1 className={styles.title}>Proposals</h1>
            <div className={styles.proposalList}>
              {proposalsData?.proposals.map((proposal: Proposal) => (
                <div 
                  key={proposal.id} 
                  className={styles.proposalItem}
                >
                  <div className={styles.proposalHeader}>
                    <div className={styles.proposalTopRow}>
                      <div className={styles.proposalInfo}>
                        <Link 
                          href={`/proposal/${proposal.id}`}
                          className={styles.proposalId}
                        >
                          Proposal {proposal.id}
                        </Link>
                        <span className={styles.proposalTitle}>{proposal.title}</span>
                      </div>
                      <span className={styles.proposalStatus}>
                        {getProposalStatus(proposal)}
                      </span>
                    </div>
                    <div className={styles.proposalMeta}>
                      <span className={styles.proposer}>
                        <ENSName address={proposal.proposer.id} />
                      </span>
                      •
                      <span className={styles.timestamp}>
                        {formatDate(proposal.createdTimestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default GovernancePage; 