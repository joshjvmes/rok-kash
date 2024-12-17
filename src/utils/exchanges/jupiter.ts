import { supabase } from "@/integrations/supabase/client";

export interface JupiterRoute {
  inAmount: string;
  outAmount: string;
  priceImpactPct: number;
  marketInfos: {
    id: string;
    label: string;
    inputMint: string;
    outputMint: string;
    notEnoughLiquidity: boolean;
    minInAmount: string;
    minOutAmount: string;
    priceImpactPct: number;
    slippageBps: number;
  }[];
}

export interface JupiterQuote {
  inAmount: string;
  outAmount: string;
  routes: {
    marketInfos: {
      amountIn: string;
      amountOut: string;
      fee: string;
      priceImpact: string;
    }[];
    slippageBps: number;
  }[];
}

export async function getJupiterRoutes(
  inputMint: string,
  outputMint: string,
  amount: string,
  slippage: number = 1
): Promise<{ routes: JupiterRoute[] }> {
  const { data, error } = await supabase.functions.invoke('jupiter-proxy', {
    body: {
      method: 'getRoutes',
      inputMint,
      outputMint,
      amount,
      slippage
    }
  });

  if (error) throw error;
  return data;
}

export async function getJupiterQuote(
  inputMint: string,
  outputMint: string,
  amount: string,
  slippage: number = 1
): Promise<JupiterQuote> {
  const { data, error } = await supabase.functions.invoke('jupiter-proxy', {
    body: {
      method: 'getQuote',
      inputMint,
      outputMint,
      amount,
      slippage
    }
  });

  if (error) throw error;
  return data;
}