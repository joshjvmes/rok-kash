import { supabase } from "@/integrations/supabase/client";

export async function fetchCCXTPrice(exchange: string, symbol: string) {
  try {
    const { data, error } = await supabase.functions.invoke('ccxt-proxy', {
      body: { 
        exchange,
        symbol,
        method: 'fetchTicker'
      }
    });

    if (error) {
      console.error(`Error fetching ${exchange} price:`, error);
      return null;
    }

    return parseFloat(data.last);
  } catch (error) {
    console.error(`Error fetching ${exchange} price:`, error);
    return null;
  }
}

export async function fetchOrderBook(exchange: string, symbol: string) {
  try {
    const { data, error } = await supabase.functions.invoke('ccxt-proxy', {
      body: { 
        exchange,
        symbol,
        method: 'fetchOrderBook'
      }
    });

    if (error) {
      console.error(`Error fetching ${exchange} order book:`, error);
      return null;
    }

    return data;
  } catch (error) {
    console.error(`Error fetching ${exchange} order book:`, error);
    return null;
  }
}