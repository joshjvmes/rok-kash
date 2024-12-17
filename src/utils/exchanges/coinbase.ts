import { supabase } from "@/integrations/supabase/client";
import type { CoinbasePrice } from "../types/exchange";

export async function fetchCoinbasePrice(symbol: string) {
  try {
    const { data, error } = await supabase.functions.invoke('coinbase-proxy', {
      body: { symbol }
    });

    if (error) {
      console.error('Error fetching Coinbase price:', error);
      return null;
    }

    return parseFloat(data.data.amount);
  } catch (error) {
    console.error('Error fetching Coinbase price:', error);
    return null;
  }
}