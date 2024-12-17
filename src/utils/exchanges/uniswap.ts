import { supabase } from "@/integrations/supabase/client";

export interface UniswapQuote {
  quote: string;
  estimatedGasUsed: string;
  route: {
    protocol: string;
    tokenPath: string[];
    poolAddresses: string[];
  }[];
}

export async function getUniswapQuote(
  tokenIn: string,
  tokenOut: string,
  amount: string,
  slippagePercentage?: string
): Promise<UniswapQuote | null> {
  try {
    const { data, error } = await supabase.functions.invoke('uniswap-proxy', {
      body: { 
        tokenIn,
        tokenOut,
        amount,
        slippagePercentage
      }
    });

    if (error) {
      console.error('Error fetching Uniswap quote:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching Uniswap quote:', error);
    return null;
  }
}