import { supabase } from "@/integrations/supabase/client";

export async function fetchCCXTPrice(exchange: string, symbol: string) {
  try {
    const { data, error } = await supabase.functions.invoke('ccxt-proxy', {
      body: { exchange, symbol, method: 'fetchTicker' }
    });

    if (error) {
      console.error(`Error fetching ${exchange} price:`, error);
      throw error;
    }

    return data?.last || null;
  } catch (error) {
    console.error(`Error fetching ${exchange} price:`, error);
    throw error;
  }
}

export async function fetchOrderBook(exchange: string, symbol: string) {
  try {
    const { data, error } = await supabase.functions.invoke('ccxt-proxy', {
      body: { exchange, symbol, method: 'fetchOrderBook' }
    });

    if (error) {
      console.error(`Error fetching ${exchange} order book:`, error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error(`Error fetching ${exchange} order book:`, error);
    throw error;
  }
}

export async function fetchTrades(exchange: string, symbol: string) {
  try {
    const { data, error } = await supabase.functions.invoke('ccxt-proxy', {
      body: { exchange, symbol, method: 'fetchTrades' }
    });

    if (error) {
      console.error(`Error fetching ${exchange} trades:`, error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error(`Error fetching ${exchange} trades:`, error);
    throw error;
  }
}

export async function createOrder(
  exchange: string,
  symbol: string,
  type: 'market' | 'limit',
  side: 'buy' | 'sell',
  amount: number,
  price?: number
) {
  try {
    console.log(`Creating ${side} order on ${exchange} for ${symbol}`);
    
    const params: any = {
      type,
      side,
      amount,
    };

    if (type === 'limit' && price) {
      params.price = price;
    }

    const { data, error } = await supabase.functions.invoke('ccxt-proxy', {
      body: {
        exchange,
        symbol,
        method: 'createOrder',
        params
      }
    });

    if (error) {
      console.error(`Error creating order on ${exchange}:`, error);
      throw error;
    }

    console.log(`Successfully created order on ${exchange}:`, data);
    return data;
  } catch (error) {
    console.error(`Error creating order on ${exchange}:`, error);
    throw error;
  }
}

export async function fetchBalance(exchange: string) {
  try {
    console.log(`Fetching balance for ${exchange}...`);
    
    const { data, error } = await supabase.functions.invoke('ccxt-proxy', {
      body: { exchange, method: 'fetchBalance' }
    });

    if (error) {
      console.error(`Error fetching ${exchange} balance:`, error);
      throw error;
    }

    console.log(`Successfully fetched ${exchange} balance:`, data);
    return data;
  } catch (error) {
    console.error(`Error fetching ${exchange} balance:`, error);
    throw error;
  }
}

export async function fetchMarketStructure(exchange: string, symbol: string) {
  try {
    const { data, error } = await supabase.functions.invoke('ccxt-proxy', {
      body: { exchange, symbol, method: 'fetchMarket' }
    });

    if (error) {
      console.error(`Error fetching ${exchange} market structure:`, error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error(`Error fetching ${exchange} market structure:`, error);
    throw error;
  }
}
