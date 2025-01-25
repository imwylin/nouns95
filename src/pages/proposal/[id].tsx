import { useRouter } from 'next/router';
import type { NextPage } from 'next';
import { useQuery } from '@apollo/client';
import { ENSName } from 'react-ens-name';
import ReactMarkdown from 'react-markdown';
import remarkImages from 'remark-images';
import styles from '../../styles/proposal.module.css';
import Navbar from '../../components/NavBar/NavBar';
import { GET_PROPOSAL_BY_ID } from '../../graphql/queries';
import Link from 'next/link';

interface Vote {
  id: string;
  voter: {
    id: string;
  };
  support: boolean;
  votes: string;
  reason?: string;
  blockTimestamp: string;
}

interface FeedbackPost {
  id: string;
  voter: {
    id: string;
  };
  supportDetailed: number;
  votes: string;
  reason?: string;
  createdTimestamp: string;
}

interface Proposal {
  id: string;
  title: string;
  description: string;
  proposer: {
    id: string;
  };
  status: string;
  createdTimestamp: string;
  startBlock: string;
  endBlock: string;
  forVotes: string;
  againstVotes: string;
  abstainVotes: string;
  quorumVotes: string;
  proposalThreshold: string;
  totalSupply: string;
  adjustedTotalSupply: string;
  executionETA: string | null;
  voteSnapshotBlock: string;
  clientId: number;
  votes: Vote[];
  feedbackPosts: FeedbackPost[];
}

const ProposalPage: NextPage = () => {
  const router = useRouter();
  const { id } = router.query;

  const { loading, error, data } = useQuery(GET_PROPOSAL_BY_ID, {
    variables: { id },
    skip: !id
  });

  const formatDate = (timestamp: string) => {
    return new Date(parseInt(timestamp) * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getProposalStatus = (proposal: Proposal) => {
    // If the status is anything other than ACTIVE, return it as is
    if (proposal.status !== 'ACTIVE') {
      return proposal.status;
    }

    // For ACTIVE proposals, check if they've ended
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const endTime = parseInt(proposal.endBlock) * 13; // Approximate block time in seconds
    
    if (currentTimestamp > endTime) {
      // Voting has ended, check the results
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

  const getSupportType = (item: Vote | FeedbackPost) => {
    if ('support' in item) {
      return item.support ? 'For' : 'Against';
    } else {
      switch (item.supportDetailed) {
        case 0:
          return 'Against';
        case 1:
          return 'For';
        case 2:
          return 'Abstain';
        default:
          return 'Unknown';
      }
    }
  };

  const getItemTimestamp = (item: Vote | FeedbackPost) => {
    return 'blockTimestamp' in item ? item.blockTimestamp : item.createdTimestamp;
  };

  const proposal: Proposal | undefined = data?.proposal;

  return (
    <div className={styles.pageWrapper}>
      <Navbar backgroundColor="transparent" />
      <main className={styles.main}>
        <div className={styles.proposalContainer}>
          {loading && <div className={styles.loading}>Loading proposal data...</div>}
          {error && <div className={styles.error}>Error: {error.message}</div>}
          
          {proposal && (
            <>
              <div className={styles.proposalContent}>
                <div className={styles.proposalHeader}>
                  <Link href="/governance" className={styles.backButton}>
                    ← Back to Governance
                  </Link>
                  <div className={styles.proposalId}>
                    Proposal {proposal.id}
                  </div>
                  <div className={styles.proposalStatus}>
                    {getProposalStatus(proposal)}
                  </div>
                  <div className={styles.votingStats}>
                    <div className={styles.voteStat}>
                      <span className={styles.voteLabel}>For</span>
                      <span className={styles.voteCount}>{parseInt(proposal.forVotes)}</span>
                    </div>
                    <div className={styles.voteStat}>
                      <span className={styles.voteLabel}>Against</span>
                      <span className={styles.voteCount}>{parseInt(proposal.againstVotes)}</span>
                    </div>
                    <div className={styles.voteStat}>
                      <span className={styles.voteLabel}>Abstain</span>
                      <span className={styles.voteCount}>{parseInt(proposal.abstainVotes)}</span>
                    </div>
                  </div>
                  <div className={styles.proposalTitle}>
                    {proposal.title}
                  </div>
                  <div className={styles.proposalMeta}>
                    <span className={styles.proposer}>
                      Proposed by <ENSName address={proposal.proposer.id} />
                    </span>
                    •
                    <span className={styles.timestamp}>
                      {formatDate(proposal.createdTimestamp)}
                    </span>
                  </div>
                </div>
                <div className={styles.proposalDescription}>
                  <ReactMarkdown 
                    remarkPlugins={[remarkImages]}
                    components={{
                      img: ({node, ...props}) => (
                        <div className={styles.imageWrapper}>
                          <img {...props} className={styles.markdownImage} />
                        </div>
                      )
                    }}
                  >
                    {proposal.description}
                  </ReactMarkdown>
                </div>
              </div>
              <div className={styles.activitySection}>
                <h2>Recent Activity</h2>
                <div className={styles.activityList}>
                  {[...proposal.votes, ...proposal.feedbackPosts]
                    .sort((a, b) => parseInt(getItemTimestamp(b)) - parseInt(getItemTimestamp(a)))
                    .map((item) => (
                      <div key={item.id} className={styles.activityItem}>
                        <div className={styles.activityHeader}>
                          <div className={styles.voterInfo}>
                            <img 
                              src={`https://cdn.stamp.fyi/avatar/${item.voter.id}`}
                              alt=""
                              className={styles.avatar}
                            />
                            <ENSName address={item.voter.id} />
                          </div>
                          <div className={styles.activityMeta}>
                            <span className={styles.support}>
                              {'support' in item ? 'Voted' : 'Signaled'} {getSupportType(item)}
                            </span>
                            <span className={styles.votes}>
                              {parseInt(item.votes)} {parseInt(item.votes) === 1 ? 'vote' : 'votes'}
                            </span>
                            <span className={styles.timestamp}>
                              {formatDate(getItemTimestamp(item))}
                            </span>
                          </div>
                        </div>
                        {item.reason && (
                          <div className={styles.activityReason}>
                            <p>{item.reason}</p>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default ProposalPage; 