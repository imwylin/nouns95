import { useRouter } from 'next/router';
import type { NextPage } from 'next';
import { useQuery } from '@apollo/client';
import { ENSName } from 'react-ens-name';
import ReactMarkdown from 'react-markdown';
import remarkImages from 'remark-images';
import styles from '../../styles/proposal.module.css';
import { GET_PROPOSAL_BY_ID } from '../../graphql/queries';
import Link from 'next/link';
import { useWriteContract, useAccount, useBlockNumber } from 'wagmi';
import { useState } from 'react';
import { mainnet } from 'viem/chains';
import { encodeFunctionData } from 'viem';
import { getTransactionDescription, getTargetName } from '../../utils/transactionConstants';
import { formatEther } from 'ethers/lib/utils';
import { simulateTransaction, simulateProposalTransactions } from '../../utils/tenderly';
import { NOUNS_CONTRACTS, TOKEN_ADDRESSES, VOTE_ABI, getContractName } from '../../utils/contracts';

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
  proposer: {
    id: string;
  };
  signers: {
    id: string;
  }[];
  targets: string[];
  values: string[];
  signatures: string[];
  calldatas: string[];
  createdTimestamp: string;
  createdBlock: string;
  lastUpdatedTimestamp: string;
  lastUpdatedBlock: string;
  createdTransactionHash: string;
  lastUpdatedTransactionHash: string;
  startBlock: string;
  endBlock: string;
  proposalThreshold: string;
  quorumVotes: string;
  forVotes: string;
  againstVotes: string;
  abstainVotes: string;
  title: string;
  description: string;
  status: string;
  executionETA: string | null;
  votes: Vote[];
  totalSupply: string;
  adjustedTotalSupply: string;
  minQuorumVotesBPS: number;
  maxQuorumVotesBPS: number;
  quorumCoefficient: string;
  objectionPeriodEndBlock: string;
  updatePeriodEndBlock: string | null;
  feedbackPosts: FeedbackPost[];
  onTimelockV1: boolean | null;
  voteSnapshotBlock: string;
  canceledBlock: string | null;
  canceledTimestamp: string | null;
  canceledTransactionHash: string | null;
  executedBlock: string | null;
  executedTimestamp: string | null;
  executedTransactionHash: string | null;
  vetoedBlock: string | null;
  vetoedTimestamp: string | null;
  vetoedTransactionHash: string | null;
  queuedBlock: string | null;
  queuedTimestamp: string | null;
  queuedTransactionHash: string | null;
  clientId: number;
}

interface SimulationResult {
  index: number;
  target: string;
  signature: string;
  description: string;
  success: boolean;
  error?: string;
  gasUsed?: number;
  gasLimit?: number;
  detailedError?: {
    message: string;
    reason?: string;
    decodedError?: string;
    address?: string;
    function?: string;
    raw_error?: string;
    subErrors?: { address: string; function?: string; error?: string; reason?: string }[];
  };
  stateChanges?: { pretty: string; address?: string; label?: string; soltype?: string }[];
  logs?: { address: string; name?: string; data: string }[];
  balanceChanges?: { originalBalance: string; newBalance: string; address: string }[];
  network?: { blockNumber: number; gasPrice: string; gasLimit: number };
}

const VoteWindow = ({ proposalId }: { proposalId: string }) => {
  const { writeContract, status, error } = useWriteContract();
  const { isConnected, chain, address } = useAccount();
  const [selectedSupport, setSelectedSupport] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationError, setSimulationError] = useState<string | null>(null);

  const getCleanErrorMessage = (error: Error | null) => {
    if (!error) return '';
    
    // Handle user rejection
    if (error.message.includes('User rejected signature request')) {
      return 'Transaction was rejected by user';
    }

    // Handle other common errors
    if (error.message.includes('insufficient funds')) {
      return 'Insufficient funds to complete transaction';
    }

    // For other errors, return a generic message
    return 'Error submitting vote. Please try again.';
  };

  const handleSubmitVote = async () => {
    if (selectedSupport === null || !address) return;
    if (!isConnected || chain?.id !== mainnet.id) return;

    setIsSimulating(true);
    setSimulationError(null);

    // Simulate the transaction first
    const simulation = await simulateTransaction({
      from: address,
      to: NOUNS_CONTRACTS.GOVERNOR,
      data: encodeFunctionData({
        abi: VOTE_ABI,
        functionName: 'castRefundableVoteWithReason',
        args: [BigInt(proposalId), selectedSupport, reason, 11],
      }),
    });

    setIsSimulating(false);

    if (!simulation.success) {
      setSimulationError(simulation.error || 'Simulation failed');
      return;
    }

    // If simulation succeeds, submit the transaction
    writeContract({
      address: NOUNS_CONTRACTS.GOVERNOR,
      abi: VOTE_ABI,
      functionName: 'castRefundableVoteWithReason',
      args: [BigInt(proposalId), selectedSupport, reason, 11]
    });
  };

  const isLoading = status === 'pending' || isSimulating;
  const isError = status === 'error' || !!simulationError;
  const errorMessage = simulationError || getCleanErrorMessage(error);

  if (!isConnected) {
    return (
      <div className={styles.voteWindow}>
        <h2>Cast Your Vote</h2>
        <div className={styles.voteMessage}>Please connect your wallet to vote</div>
      </div>
    );
  }

  if (chain?.id !== mainnet.id) {
    return (
      <div className={styles.voteWindow}>
        <h2>Cast Your Vote</h2>
        <div className={styles.voteMessage}>Please connect to Ethereum Mainnet to vote</div>
      </div>
    );
  }

  return (
    <div className={styles.voteWindow}>
      <h2>Cast Your Vote</h2>
      <div className={styles.voteButtons}>
        <button 
          className={`${styles.voteButton} ${selectedSupport === 1 ? styles.selected : ''}`}
          onClick={() => setSelectedSupport(1)}
          disabled={isLoading}
        >
          For
        </button>
        <button 
          className={`${styles.voteButton} ${selectedSupport === 0 ? styles.selected : ''}`}
          onClick={() => setSelectedSupport(0)}
          disabled={isLoading}
        >
          Against
        </button>
        <button 
          className={`${styles.voteButton} ${selectedSupport === 2 ? styles.selected : ''}`}
          onClick={() => setSelectedSupport(2)}
          disabled={isLoading}
        >
          Abstain
        </button>
      </div>
      <div className={styles.reasonInput}>
        <label htmlFor="voteReason">Reason (optional):</label>
        <textarea
          id="voteReason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={isLoading}
          placeholder="Enter your reason for voting (optional)"
          rows={3}
        />
      </div>
      <button
        className={`${styles.submitButton} ${!selectedSupport ? styles.disabled : ''}`}
        onClick={handleSubmitVote}
        disabled={isLoading || selectedSupport === null}
      >
        {isSimulating ? 'Simulating...' : 'Submit Vote'}
      </button>
      {isLoading && !isSimulating && <div className={styles.voteStatus}>Submitting vote...</div>}
      {isError && <div className={styles.voteError}>{errorMessage}</div>}
    </div>
  );
};

const decodeValue = (signature: string, calldata: string): string => {
  try {
    console.log('Decoding value from:', {
      signature,
      calldata,
      length: calldata.length
    });

    // Remove '0x' prefix if present
    const data = calldata.startsWith('0x') ? calldata.slice(2) : calldata;
    
    // Each parameter is 32 bytes (64 characters)
    const params = data.match(/.{1,64}/g) || [];
    console.log('Split parameters:', params);

    // createStream(address,uint256,address,uint256,uint256,uint8,address)
    if (signature.startsWith('createStream')) {
      // For createStream, the amount is the second parameter
      // Convert from hex to decimal
      const amountHex = params[1];
      // Remove leading zeros
      const cleanHex = amountHex.replace(/^0+/, '');
      // Convert to decimal
      const amount = cleanHex ? parseInt(cleanHex, 16).toString() : '0';
      console.log('Extracted createStream amount:', {
        amountHex,
        cleanHex,
        amount
      });
      return amount;
    }
    
    // sendOrRegisterDebt(address,uint256)
    if (signature.startsWith('sendOrRegisterDebt')) {
      const amountHex = params[1];
      const cleanHex = amountHex.replace(/^0+/, '');
      const amount = cleanHex ? parseInt(cleanHex, 16).toString() : '0';
      console.log('Extracted sendOrRegisterDebt amount:', {
        amountHex,
        cleanHex,
        amount
      });
      return amount;
    }

    console.log('No matching function signature found');
    return '0';
  } catch (error) {
    console.error('Error decoding value:', error);
    console.log('Raw calldata that caused error:', calldata);
    return '0';
  }
};

const formatValue = (value: string, target: string, signature?: string, calldata?: string): string => {
  // Try to decode value from calldata if available
  if (value === '0' && signature && calldata) {
    value = decodeValue(signature, calldata);
    console.log('Decoded value from calldata:', value);
  }

  console.log('Formatting value:', {
    value,
    target,
    valueType: typeof value,
    valueLength: value?.length,
    isHex: value?.startsWith('0x')
  });

  if (!value) {
    console.log('Value is empty');
    return '0';
  }

  try {
    // Always convert to BigInt first to handle any format
    let bigValue: bigint;
    
    if (value.startsWith('0x')) {
      // Handle hex values
      bigValue = BigInt(value);
    } else if (value.includes('e')) {
      // Handle scientific notation
      bigValue = BigInt(Math.floor(parseFloat(value)));
    } else {
      // Handle regular decimal strings
      bigValue = BigInt(value);
    }

    console.log('Parsed BigInt value:', bigValue.toString());

    // If the value is 0, return early
    if (bigValue === BigInt(0)) {
      console.log('Value is zero');
      return '0';
    }

    // USDC has 6 decimals
    if (target.toLowerCase() === TOKEN_ADDRESSES.USDC.toLowerCase()) {
      console.log('Formatting as USDC');
      const usdcAmount = Number(bigValue) / 1e6;
      console.log('USDC amount:', usdcAmount);
      return `${usdcAmount.toFixed(2)} USDC`;
    }

    // ETH has 18 decimals
    console.log('Formatting as ETH');
    const ethAmount = Number(bigValue) / 1e18;
    console.log('ETH amount:', ethAmount);
    return ethAmount === 0 ? '0' : `${ethAmount.toFixed(4)} ETH`;
  } catch (error) {
    console.error('Error formatting value:', error);
    console.log('Raw value that caused error:', value);
    return '0';
  }
};

const TransactionSimulation = ({ proposal }: { proposal: Proposal }) => {
  const { address } = useAccount();
  const [isSimulating, setIsSimulating] = useState(false);
  const [results, setResults] = useState<SimulationResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSimulate = async () => {
    if (!address || !proposal) return;
    
    setIsSimulating(true);
    setResults([]);
    setError(null);

    try {
      // Validate arrays have same length
      const length = proposal.targets.length;
      if (
        proposal.values.length !== length ||
        proposal.signatures.length !== length ||
        proposal.calldatas.length !== length
      ) {
        throw new Error('Proposal data arrays have mismatched lengths');
      }

      // Map GraphQL data to transaction format
      const transactions = proposal.targets.map((target, i) => {
        // Get human readable description
        const description = getTransactionDescription(
          target,
          proposal.signatures[i],
          proposal.calldatas[i],
          proposal.values[i]
        );

        return {
          target,
          value: proposal.values[i],
          signature: proposal.signatures[i],
          calldata: proposal.calldatas[i],
          description, // Add description for display
        };
      });

      const simulationResults = await simulateProposalTransactions({
        transactions,
        executor: address,
      });

      // Add transaction details to results
      setResults(simulationResults.map((result, index) => ({
        index,
        target: proposal.targets[index],
        signature: proposal.signatures[index],
        description: transactions[index].description,
        ...result,
      })));
    } catch (error) {
      console.error('Simulation error:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className={styles.simulationSection}>
      <button
        className={styles.simulateButton}
        onClick={handleSimulate}
        disabled={!address || isSimulating}
      >
        {isSimulating ? 'Simulating...' : 'Simulate Transactions'}
      </button>

      {error && (
        <div className={styles.simulationError}>
          <div className={styles.errorMessage}>{error}</div>
        </div>
      )}

      {results.length > 0 && (
        <div className={styles.simulationResults}>
          {results.map((result) => (
            <div 
              key={result.index}
              className={`${styles.simulationResult} ${
                result.success ? styles.success : styles.error
              }`}
            >
              <div className={styles.simulationHeader}>
                <span>Transaction {result.index + 1}</span>
                <span className={styles.simulationStatus}>
                  {result.success ? '✓ Success' : '✗ Failed'}
                </span>
              </div>
              
              <div className={styles.transactionDetails}>
                <div className={styles.transactionTarget}>
                  Target: {getContractName(result.target)}
                </div>
                {result.description && (
                  <div className={styles.transactionDescription}>
                    {result.description}
                  </div>
                )}
                {result.signature && (
                  <div className={styles.transactionSignature}>
                    Function: {result.signature}
                  </div>
                )}
              </div>

              {!result.success && result.detailedError && (
                <div className={styles.simulationError}>
                  <div className={styles.errorMessage}>
                    {result.detailedError.message}
                  </div>
                  {result.detailedError.function && (
                    <div className={styles.errorFunction}>
                      Failed Function: {result.detailedError.function}
                    </div>
                  )}
                  {result.detailedError.reason && (
                    <div className={styles.errorReason}>
                      Reason: {result.detailedError.reason}
                    </div>
                  )}
                  {result.detailedError.decodedError && (
                    <div className={styles.decodedError}>
                      Decoded: {result.detailedError.decodedError}
                    </div>
                  )}
                  {result.detailedError.raw_error && (
                    <div className={styles.rawError}>
                      Raw Error: {result.detailedError.raw_error}
                    </div>
                  )}
                  {result.detailedError.address && (
                    <div className={styles.errorAddress}>
                      Failed at: {getContractName(result.detailedError.address)}
                    </div>
                  )}
                  {result.detailedError.subErrors && result.detailedError.subErrors.length > 0 && (
                    <div className={styles.subErrors}>
                      <div className={styles.subErrorsTitle}>Error Trace:</div>
                      {result.detailedError.subErrors.map((error, i) => (
                        <div key={i} className={styles.subError}>
                          <div className={styles.subErrorContract}>
                            Contract: {error.address ? getContractName(error.address) : 'Unknown'}
                          </div>
                          {error.function && (
                            <div className={styles.subErrorFunction}>
                              Function: {error.function}
                            </div>
                          )}
                          {error.error && (
                            <div className={styles.subErrorMessage}>
                              Error: {error.error}
                            </div>
                          )}
                          {error.reason && (
                            <div className={styles.subErrorReason}>
                              Reason: {error.reason}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {result.stateChanges && result.stateChanges.length > 0 && (
                <div className={styles.stateChanges}>
                  <div className={styles.stateChangesTitle}>State Changes:</div>
                  {result.stateChanges.map((change, i) => (
                    <div key={i} className={styles.stateChange}>
                      <div className={styles.stateChangeContract}>
                        Contract: {change.address ? getContractName(change.address) : 'Unknown'}
                      </div>
                      {change.label && (
                        <div className={styles.stateChangeLabel}>
                          {change.label}
                        </div>
                      )}
                      <div className={styles.stateChangeValue}>
                        {change.pretty}
                      </div>
                      {change.soltype && (
                        <div className={styles.stateChangeType}>
                          Type: {change.soltype}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {result.logs && result.logs.length > 0 && (
                <div className={styles.eventLogs}>
                  <div className={styles.eventLogsTitle}>Event Logs:</div>
                  {result.logs.map((log, i) => (
                    <div key={i} className={styles.eventLog}>
                      <div className={styles.eventLogContract}>
                        Contract: {getContractName(log.address)}
                      </div>
                      {log.name && (
                        <div className={styles.eventLogName}>
                          Event: {log.name}
                        </div>
                      )}
                      <div className={styles.eventLogData}>
                        Data: {log.data}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {result.balanceChanges && result.balanceChanges.length > 0 && (
                <div className={styles.balanceChanges}>
                  <div className={styles.balanceChangesTitle}>Balance Changes:</div>
                  {result.balanceChanges.map((change, i) => (
                    <div key={i} className={styles.balanceChange}>
                      <div className={styles.balanceChangeContract}>
                        {getContractName(change.address)}
                      </div>
                      <div className={styles.balanceChangeValues}>
                        <div>From: {formatEther(change.originalBalance)} ETH</div>
                        <div>To: {formatEther(change.newBalance)} ETH</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {result.network && (
                <div className={styles.networkInfo}>
                  <div className={styles.networkInfoTitle}>Network State:</div>
                  <div>Block: {result.network.blockNumber}</div>
                  <div>Gas Price: {formatEther(result.network.gasPrice)} ETH</div>
                  <div>Gas Limit: {result.network.gasLimit.toLocaleString()}</div>
                </div>
              )}
              {result.gasUsed && (
                <div className={styles.simulationGas}>
                  Estimated Gas: {result.gasUsed.toLocaleString()}
                  {result.gasLimit && ` / ${result.gasLimit.toLocaleString()}`}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const ProposalContent = ({ proposalId, inWindow = false }: { proposalId: string; inWindow?: boolean }) => {
  const { data, loading, error } = useQuery(GET_PROPOSAL_BY_ID, {
    variables: { id: proposalId },
    pollInterval: 10000
  });
  const { data: blockNumber } = useBlockNumber({ watch: true });

  if (loading) {
    return <div className={styles.loading}>Loading proposal...</div>;
  }

  if (error) {
    return <div className={styles.error}>Error loading proposal: {error.message}</div>;
  }

  if (!data?.proposal) {
    return <div className={styles.error}>Proposal not found</div>;
  }

  const proposal = data.proposal;

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

    // Use actual block number from chain if available, convert to number
    const currentBlock = blockNumber ? Number(blockNumber) : Math.floor(Date.now() / 1000 / 12);
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

  return (
    <div className={`${styles.pageWrapper} ${inWindow ? styles.inWindow : ''}`}>
      <div className={styles.main}>
        <div className={styles.proposalContainer}>
          <div className={styles.proposalContent}>
            <div className={styles.proposalHeader}>
              <div className={styles.proposalId}>Proposal {proposal.id}</div>
              
              <div className={styles.quorumInfo}>
                <span className={styles.quorumLabel}>Quorum Required</span>
                <span className={styles.quorumValue}>{proposal.quorumVotes} votes</span>
              </div>

              <div className={styles.votingStats}>
                <div className={styles.voteStat}>
                  <span className={styles.voteLabel}>For</span>
                  <span className={styles.voteCount}>{proposal.forVotes}</span>
                </div>
                <div className={styles.voteStat}>
                  <span className={styles.voteLabel}>Against</span>
                  <span className={styles.voteCount}>{proposal.againstVotes}</span>
                </div>
                <div className={styles.voteStat}>
                  <span className={styles.voteLabel}>Abstain</span>
                  <span className={styles.voteCount}>{proposal.abstainVotes}</span>
                </div>
              </div>

              <div className={styles.proposalTitle}>{proposal.title}</div>
              
              <div className={styles.proposalMeta}>
                <div className={styles.proposerInfo}>
                  <img 
                    src={`https://cdn.stamp.fyi/avatar/${proposal.proposer.id}`}
                    alt=""
                    className={styles.avatar}
                  />
                  <ENSName address={proposal.proposer.id} />
                </div>
                <span className={styles.timestamp}>
                  {formatDate(proposal.createdTimestamp)}
                </span>
              </div>

              <div className={styles.proposalStatus}>
                {getProposalStatus(proposal)}
              </div>
            </div>

            {proposal.targets.length > 0 && (
              <div className={styles.transactions}>
                <div className={styles.transactionsHeader}>
                  <h2 className={styles.sectionTitle}>Transactions</h2>
                  <TransactionSimulation proposal={proposal} />
                </div>
                {console.log('Full proposal data:', {
                  targets: proposal.targets,
                  values: proposal.values,
                  signatures: proposal.signatures,
                  calldatas: proposal.calldatas
                })}
                {proposal.targets.map((target: string, index: number) => {
                  console.log(`Transaction ${index}:`, {
                    target,
                    value: proposal.values[index],
                    signature: proposal.signatures[index],
                    calldata: proposal.calldatas[index]
                  });
                  return (
                    <div key={index} className={styles.transaction}>
                      <div className={styles.transactionHeader}>
                        <span className={styles.target}>{getContractName(target)}</span>
                        <span className={styles.value}>
                          {formatValue(
                            proposal.values[index],
                            target,
                            proposal.signatures[index],
                            proposal.calldatas[index]
                          )}
                        </span>
                      </div>
                      <div className={styles.description}>
                        {getTransactionDescription(
                          target,
                          proposal.signatures[index],
                          proposal.calldatas[index],
                          proposal.values[index]
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className={styles.proposalDescription}>
              <ReactMarkdown remarkPlugins={[remarkImages]}>
                {proposal.description}
              </ReactMarkdown>
            </div>
          </div>

          <div className={styles.activitySection}>
            <VoteWindow proposalId={proposal.id} />
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
        </div>
      </div>
    </div>
  );
};

const ProposalPage: NextPage = () => {
  const router = useRouter();
  const { id } = router.query;

  if (!id || typeof id !== 'string') {
    return <div className={styles.error}>Invalid proposal ID</div>;
  }

  return <ProposalContent proposalId={id} />;
};

export default ProposalPage; 