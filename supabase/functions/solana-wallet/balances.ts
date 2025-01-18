import { Connection, PublicKey, LAMPORTS_PER_SOL } from "npm:@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "npm:@solana/spl-token";

const SOLANA_RPC_URL = 'https://api.mainnet-beta.solana.com';
const connection = new Connection(SOLANA_RPC_URL, 'confirmed');

export async function getSolBalance(walletAddress: string): Promise<number> {
  console.log('Fetching SOL balance for:', walletAddress);
  try {
    const publicKey = new PublicKey(walletAddress);
    const balance = await connection.getBalance(publicKey);
    const solBalance = balance / LAMPORTS_PER_SOL;
    console.log('SOL balance:', solBalance);
    return solBalance;
  } catch (error) {
    console.error('Error getting SOL balance:', error);
    throw new Error('Failed to get Solana balance');
  }
}

export async function getTokenBalance(tokenMint: string, walletAddress: string) {
  console.log(`Fetching balance for token ${tokenMint} and wallet ${walletAddress}`);
  try {
    const walletPubkey = new PublicKey(walletAddress);
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      walletPubkey,
      {
        programId: TOKEN_PROGRAM_ID,
      }
    );

    const tokenAccount = tokenAccounts.value.find(
      (account) => account.account.data.parsed.info.mint === tokenMint
    );

    if (tokenAccount) {
      const parsedInfo = tokenAccount.account.data.parsed.info;
      return {
        mint: tokenMint,
        balance: parsedInfo.tokenAmount.amount,
        decimals: parsedInfo.tokenAmount.decimals
      };
    }

    return {
      mint: tokenMint,
      balance: '0',
      decimals: 6
    };
  } catch (error) {
    console.error('Error fetching token balance:', error);
    throw new Error('Failed to fetch token balance');
  }
}