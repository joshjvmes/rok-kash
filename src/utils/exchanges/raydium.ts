import { supabase } from "@/integrations/supabase/client";

export interface RaydiumQuote {
  amountIn: string;
  amountOut: string;
  fee: string;
  priceImpact: string;
  route: {
    tokenIn: string;
    tokenOut: string;
    pools: string[];
  };
}

export interface RaydiumPoolInfo {
  address: string;
  data: string | null;
  exists: boolean;
}

export async function getRaydiumPoolInfo(poolAddress: string): Promise<RaydiumPoolInfo> {
  const { data, error } = await supabase.functions.invoke('raydium-proxy', {
    body: {
      method: 'getPoolInfo',
      poolAddress
    }
  });

  if (error) throw error;
  return data;
}

export async function getRaydiumQuote(
  poolAddress: string,
  tokenInMint: string,
  tokenOutMint: string,
  amount: string
): Promise<RaydiumQuote> {
  const { data, error } = await supabase.functions.invoke('raydium-proxy', {
    body: {
      method: 'getQuote',
      poolAddress,
      tokenInMint,
      tokenOutMint,
      amount
    }
  });

  if (error) throw error;
  return data;
}