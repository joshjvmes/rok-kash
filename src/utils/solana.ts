import { Connection, PublicKey, clusterApiUrl, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

// Initialize connection to Solana mainnet
export const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');

/**
 * Get SOL balance for a wallet address
 * @param walletAddress Solana wallet address
 * @returns Balance in SOL
 */
export async function getSolanaBalance(walletAddress: string): Promise<number> {
  try {
    console.log('Fetching SOL balance for wallet:', walletAddress);
    const publicKey = new PublicKey(walletAddress);
    const balance = await connection.getBalance(publicKey);
    const solBalance = balance / LAMPORTS_PER_SOL;
    console.log('SOL balance:', solBalance);
    return solBalance;
  } catch (error) {
    console.error('Error getting Solana balance:', error);
    throw new Error('Failed to get Solana balance');
  }
}

/**
 * Get all token accounts for a wallet
 * @param walletAddress Wallet address to check
 * @returns Array of token account info
 */
export async function getTokenAccounts(walletAddress: string) {
  try {
    console.log('Fetching token accounts for wallet:', walletAddress);
    const publicKey = new PublicKey(walletAddress);
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
      programId: TOKEN_PROGRAM_ID,
    });

    console.log('Found token accounts:', tokenAccounts.value);
    return tokenAccounts.value;
  } catch (error) {
    console.error('Error fetching token accounts:', error);
    throw new Error('Failed to fetch token accounts');
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