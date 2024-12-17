import { supabase } from "@/integrations/supabase/client";
import type { KrakenPrice } from "../types/exchange";

export async function fetchKrakenPrice(symbol: string) {
  try {
    const { data, error } = await supabase.functions.invoke('kraken-proxy', {
      body: { symbol }
    });

    if (error) {
      console.error('Error fetching Kraken price:', error);
      return null;
    }

    const pair = Object.keys(data.result)[0];
    return parseFloat(data.result[pair].c[0]);
  } catch (error) {
    console.error('Error fetching Kraken price:', error);
    return null;
  }
}