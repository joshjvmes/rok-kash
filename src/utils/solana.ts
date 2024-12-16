/**
 * IMPORTANT NOTICE:
 * This file contains Solana Web3 integration utilities.
 * Make sure to handle errors appropriately in production.
 */

import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';

// Initialize connection to Solana devnet
export const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

/**
 * Get SOL balance for a wallet address
 * @param walletAddress Solana wallet address
 * @returns Balance in SOL
 */
export async function getSolanaBalance(walletAddress: string): Promise<number> {
  try {
    const publicKey = new PublicKey(walletAddress);
    const balance = await connection.getBalance(publicKey);
    return balance / 1e9; // Convert lamports to SOL
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