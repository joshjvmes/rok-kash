import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { supabase } from "@/integrations/supabase/client";

export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  tags?: string[];
}

export interface TokenBalance {
  mint: string;
  balance: string;
  decimals: number;
}

export async function getTokenList(): Promise<TokenInfo[]> {
  try {
    console.log('Fetching token list from Supabase...');
    const { data, error } = await supabase.functions.invoke('solana-proxy', {
      body: {
        method: 'getTokenList'
      }
    });

    if (error) {
      console.error('Error fetching token list:', error);
      throw error;
    }

    console.log('Successfully fetched token list:', data);
    return data;
  } catch (error) {
    console.error('Failed to fetch token list:', error);
    throw error;
  }
}

export async function getTokenBalance(tokenMint: string, walletAddress: string): Promise<TokenBalance> {
  try {
    console.log(`Fetching balance for token ${tokenMint} and wallet ${walletAddress}`);
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    const walletPubkey = new PublicKey(walletAddress);

    // Get all token accounts owned by the wallet
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      walletPubkey,
      {
        programId: TOKEN_PROGRAM_ID,
      }
    );

    // Find the specific token account for this mint
    const tokenAccount = tokenAccounts.value.find(
      (account) => account.account.data.parsed.info.mint === tokenMint
    );

    if (tokenAccount) {
      console.log('Token account found:', tokenAccount);
      const parsedInfo = tokenAccount.account.data.parsed.info;
      
      return {
        mint: tokenMint,
        balance: parsedInfo.tokenAmount.amount,
        decimals: parsedInfo.tokenAmount.decimals
      };
    } else {
      console.log('No token account found, returning zero balance');
      return {
        mint: tokenMint,
        balance: '0',
        decimals: 6 // Default decimals
      };
    }
  } catch (error) {
    console.error('Error fetching token balance:', error);
    throw error;
  }
}

export async function getTokenMetadata(mint: string): Promise<TokenInfo> {
  try {
    console.log('Fetching token metadata for mint:', mint);
    const { data, error } = await supabase.functions.invoke('solana-proxy', {
      body: {
        method: 'getTokenMetadata',
        params: { mint }
      }
    });

    if (error) {
      console.error('Error fetching token metadata:', error);
      throw error;
    }

    console.log('Successfully fetched token metadata:', data);
    return data;
  } catch (error) {
    console.error('Failed to fetch token metadata:', error);
    throw error;
  }
}