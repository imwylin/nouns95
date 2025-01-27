import { encodeFunctionData } from 'viem';

const TENDERLY_USER = 'nouns95';
const TENDERLY_PROJECT = 'nouns95';
const TENDERLY_ACCESS_KEY = process.env.NEXT_PUBLIC_TENDERLY_ACCESS_KEY;

interface SimulationResponse {
  simulation: {
    status: boolean;
    error: string | null;
    transaction: {
      status: boolean;
      error_message: string | null;
      gas_used: number;
      call_trace: {
        error: string;
        error_reason: string;
        address: string;
        decoded_error?: string;
        function?: string;
        input?: string;
        value?: string;
        gas_used?: number;
        gas_limit?: number;
        type?: string;
        raw_error?: string;
        children?: Array<{
          address: string;
          function?: string;
          error?: string;
          error_reason?: string;
        }>;
      }[];
      state_changes: {
        raw: string;
        pretty: string;
        soltype?: string;
        address: string;
        label?: string;
      }[];
      logs: {
        name?: string;
        anonymous: boolean;
        topics: string[];
        data: string;
        address: string;
      }[];
      balance_changes: {
        address: string;
        original: string;
        dirty: string;
        is_miner: boolean;
      }[];
      network: {
        block_number: number;
        chain_id: number;
        gas_limit: number;
        gas_price: string;
      };
    };
  };
}

interface TransactionSimulationResult {
  success: boolean;
  error?: string;
  detailedError?: {
    message: string;
    reason?: string;
    address?: string;
    decodedError?: string;
    raw_error?: string;
    function?: string;
    subErrors?: Array<{
      address: string;
      function?: string;
      error?: string;
      reason?: string;
    }>;
  };
  gasUsed?: number;
  gasLimit?: number;
  stateChanges?: Array<{
    raw: string;
    pretty: string;
    soltype?: string;
    address: string;
    label?: string;
  }>;
  logs?: Array<{
    name?: string;
    topics: string[];
    data: string;
    address: string;
  }>;
  balanceChanges?: Array<{
    address: string;
    originalBalance: string;
    newBalance: string;
    isMiner: boolean;
  }>;
  network?: {
    blockNumber: number;
    chainId: number;
    gasLimit: number;
    gasPrice: string;
  };
}

interface ProposalTransaction {
  target: string;
  value: string;
  signature: string;
  calldata: string;
}

// Simulate a single transaction
export const simulateTransaction = async ({
  from,
  to,
  value = '0',
  data,
}: {
  from: string;
  to: string;
  value?: string;
  data: string;
}): Promise<TransactionSimulationResult> => {
  try {
    const simulation = {
      network_id: '1', // mainnet
      from,
      to,
      input: data,
      value,
      save: true,
      generate_access_list: true,
      save_if_fails: true, // Save failed simulations for debugging
      simulation_type: 'full', // Get full simulation details
    };

    const response = await fetch(
      `https://api.tenderly.co/api/v1/account/${TENDERLY_USER}/project/${TENDERLY_PROJECT}/simulate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Access-Key': TENDERLY_ACCESS_KEY || '',
        },
        body: JSON.stringify({
          simulation,
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Simulation request failed');
    }

    const result = (await response.json()) as SimulationResponse;
    const transaction = result.simulation.transaction;

    if (!transaction.status) {
      // Get the complete error trace
      const lastError = transaction.call_trace?.[transaction.call_trace.length - 1];
      const subErrors = transaction.call_trace
        ?.filter(trace => trace.error || trace.error_reason)
        .map(trace => ({
          address: trace.address,
          function: trace.function,
          error: trace.error,
          reason: trace.error_reason,
        }));
      
      return {
        success: false,
        error: transaction.error_message || 'Transaction failed',
        detailedError: lastError ? {
          message: lastError.error || transaction.error_message || 'Unknown error',
          reason: lastError.error_reason,
          address: lastError.address,
          decodedError: lastError.decoded_error,
          raw_error: lastError.raw_error,
          function: lastError.function,
          subErrors: subErrors.length > 0 ? subErrors : undefined,
        } : undefined,
        gasUsed: transaction.gas_used,
        gasLimit: transaction.network?.gas_limit,
        stateChanges: transaction.state_changes,
        logs: transaction.logs,
        balanceChanges: transaction.balance_changes?.map(change => ({
          address: change.address,
          originalBalance: change.original,
          newBalance: change.dirty,
          isMiner: change.is_miner,
        })),
        network: {
          blockNumber: transaction.network.block_number,
          chainId: transaction.network.chain_id,
          gasLimit: transaction.network.gas_limit,
          gasPrice: transaction.network.gas_price,
        },
      };
    }

    return {
      success: true,
      gasUsed: transaction.gas_used,
      gasLimit: transaction.network?.gas_limit,
      stateChanges: transaction.state_changes,
      logs: transaction.logs,
      balanceChanges: transaction.balance_changes?.map(change => ({
        address: change.address,
        originalBalance: change.original,
        newBalance: change.dirty,
        isMiner: change.is_miner,
      })),
      network: {
        blockNumber: transaction.network.block_number,
        chainId: transaction.network.chain_id,
        gasLimit: transaction.network.gas_limit,
        gasPrice: transaction.network.gas_price,
      },
    };
  } catch (error) {
    console.error('Simulation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Helper function to parse function signature
const parseFunctionSignature = (signature: string) => {
  if (!signature) return null;
  
  // Remove the trailing parenthesis if it exists
  const cleanSignature = signature.endsWith(')') ? signature : signature + ')';
  const match = cleanSignature.match(/^([^(]+)\((.*)\)$/);
  if (!match) return null;

  const [, name, params] = match;
  const types = params ? params.split(',').map(p => p.trim()) : [];
  
  return {
    name,
    types
  };
};

// Simulate all transactions in a proposal
export const simulateProposalTransactions = async ({
  transactions,
  executor,
}: {
  transactions: ProposalTransaction[];
  executor: string;
}): Promise<TransactionSimulationResult[]> => {
  const results: TransactionSimulationResult[] = [];

  for (const tx of transactions) {
    try {
      // If we have a signature, try to encode the function data
      let data = tx.calldata;
      if (tx.signature) {
        const parsedSignature = parseFunctionSignature(tx.signature);
        if (parsedSignature) {
          const { name, types } = parsedSignature;
          
          // Create ABI for this function
          const abi = [{
            name,
            type: 'function',
            inputs: types.map(type => ({ type })),
            outputs: [],
            stateMutability: 'nonpayable'
          }] as const;

          // If calldata is hex, remove '0x' prefix
          const cleanCalldata = tx.calldata.startsWith('0x') ? tx.calldata.slice(2) : tx.calldata;
          
          // Split calldata into chunks and decode parameters
          const chunks = cleanCalldata.match(/.{1,64}/g) || [];
          const args = chunks.map(chunk => '0x' + chunk);

          try {
            data = encodeFunctionData({
              abi,
              functionName: name,
              args,
            });
          } catch (encodeError) {
            console.warn('Failed to encode function data:', encodeError);
            // Fall back to using raw calldata
            data = tx.calldata;
          }
        }
      }

      // Ensure data starts with '0x'
      if (!data.startsWith('0x')) {
        data = '0x' + data;
      }

      // Ensure value is properly formatted
      let value = tx.value;
      if (!value.startsWith('0x')) {
        value = '0x' + BigInt(value).toString(16);
      }

      const result = await simulateTransaction({
        from: executor,
        to: tx.target,
        value,
        data,
      });

      results.push(result);
    } catch (error) {
      results.push({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to simulate transaction',
      });
    }
  }

  return results;
}; 