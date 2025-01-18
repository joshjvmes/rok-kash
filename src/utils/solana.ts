import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { supabase } from '@/integrations/supabase/client';

// Initialize connection to Solana network
export const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');

/**
 * Get SOL balance for a wallet address
 * @param walletAddress Solana wallet address
 * @returns Balance in SOL
 */
export async function getSolanaBalance(walletAddress: string): Promise<number> {
  try {
    console.log('Fetching SOL balance for wallet:', walletAddress);
    const { data, error } = await supabase.functions.invoke('solana-wallet', {
      body: {
        action: 'getSOLBalance',
        walletAddress
      }
    });

    if (error) throw error;
    console.log('SOL balance:', data);
    return data;
  } catch (error) {
    console.error('Error getting Solana balance:', error);
    throw new Error('Failed to get Solana balance');
  }
}

/**
 * Validate a Solana wallet address
 * @param address Address to validate
 * @returns boolean indicating if address is valid
 */
export function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}