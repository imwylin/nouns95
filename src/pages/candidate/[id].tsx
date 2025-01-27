import { useRouter } from 'next/router';
import { useQuery } from '@apollo/client';
import { ENSName } from 'react-ens-name';
import { GET_PROPOSAL_CANDIDATE } from '../../graphql/queries';
import styles from '../../styles/candidate.module.css';

const CandidatePage = () => {
  const router = useRouter();
  const { id } = router.query;

  const { loading, error, data } = useQuery(GET_PROPOSAL_CANDIDATE, {
    variables: { id },
    skip: !id
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data?.proposalCandidate) return <div>Candidate not found</div>;

  const { proposalCandidate: candidate } = data;
  const content = candidate.latestVersion.content;

  const formatDate = (timestamp: string) => {
    return new Date(parseInt(timestamp) * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={styles.pageWrapper}>
      <main className={styles.main}>
        <div className={styles.candidateContainer}>
          <div className={styles.header}>
            <h1 className={styles.title}>{content.title}</h1>
            <div className={styles.meta}>
              <div className={styles.proposerInfo}>
                <img 
                  src={`https://cdn.stamp.fyi/avatar/${content.proposer}`}
                  alt=""
                  className={styles.avatar}
                />
                <ENSName address={content.proposer} />
              </div>
              <span className={styles.timestamp}>
                {formatDate(candidate.createdTimestamp)}
              </span>
            </div>

            {content.contentSignatures.length > 0 && (
              <div className={styles.sponsorInfo}>
                • Sponsored by{' '}
                {content.contentSignatures.map((sig: any, index: number) => (
                  <span key={sig.id}>
                    {index > 0 && ', '}
                    <ENSName address={sig.signer.id} />
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className={styles.content}>
            <div className={styles.description}>
              {content.description}
            </div>

            <div className={styles.details}>
              <h2 className={styles.sectionTitle}>Details</h2>
              <div className={styles.detailsGrid}>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Proposer</span>
                  <ENSName address={content.proposer} />
                </div>
                {content.proposalIdToUpdate && (
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Updates Proposal</span>
                    <span>{content.proposalIdToUpdate}</span>
                  </div>
                )}
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Created</span>
                  <span>{formatDate(candidate.createdTimestamp)}</span>
                </div>
              </div>
            </div>

            <div className={styles.transactions}>
              <h2 className={styles.sectionTitle}>Transactions</h2>
              {content.targets.map((target: string, index: number) => (
                <div key={index} className={styles.transaction}>
                  <div className={styles.transactionHeader}>
                    <span className={styles.target}>{target}</span>
                    <span className={styles.value}>{content.values[index]} ETH</span>
                  </div>
                  <div className={styles.signature}>{content.signatures[index]}</div>
                  <div className={styles.calldata}>{content.calldatas[index]}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CandidatePage; 