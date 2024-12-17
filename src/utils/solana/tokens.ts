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
  const { data, error } = await supabase.functions.invoke('solana-proxy', {
    body: {
      method: 'getTokenList'
    }
  });

  if (error) throw error;
  return data;
}

export async function getTokenBalance(tokenMint: string, walletAddress: string): Promise<TokenBalance> {
  const { data, error } = await supabase.functions.invoke('solana-proxy', {
    body: {
      method: 'getTokenBalance',
      params: {
        tokenMint,
        walletAddress
      }
    }
  });

  if (error) throw error;
  return data;
}

export async function getTokenMetadata(mint: string): Promise<TokenInfo> {
  const { data, error } = await supabase.functions.invoke('solana-proxy', {
    body: {
      method: 'getTokenMetadata',
      params: { mint }
    }
  });

  if (error) throw error;
  return data;
}