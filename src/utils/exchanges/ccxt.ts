import { supabase } from "@/integrations/supabase/client";

export interface CCXTOrder {
  id: string;
  symbol: string;
  type: string;
  side: 'buy' | 'sell';
  price: number;
  amount: number;
  status: string;
}

/**
 * Fetches the current price from a specified exchange
 * @param exchange Exchange name (e.g., 'coinbase', 'kraken')
 * @param symbol Trading pair (e.g., 'BTC/USD')
 * @returns Promise resolving to the current price
 */
export async function fetchCCXTPrice(exchange: string, symbol: string) {
  try {
    const { data, error } = await supabase.functions.invoke('ccxt-proxy', {
      body: { 
        exchange,
        symbol,
        method: 'fetchTicker'
      }
    });

    if (error) throw new Error(`CCXT proxy error: ${error.message}`);
    if (!data?.last) throw new Error('Invalid price data received');
    
    return parseFloat(data.last);
  } catch (error) {
    console.error(`Error fetching ${exchange} price:`, error);
    return null;
  }
}

/**
 * Fetches the order book for a specified trading pair
 * @param exchange Exchange name
 * @param symbol Trading pair
 * @returns Promise resolving to the order book data
 */
export async function fetchOrderBook(exchange: string, symbol: string) {
  try {
    const { data, error } = await supabase.functions.invoke('ccxt-proxy', {
      body: { 
        exchange,
        symbol,
        method: 'fetchOrderBook'
      }
    });

    if (error) throw new Error(`CCXT proxy error: ${error.message}`);
    if (!data?.bids || !data?.asks) throw new Error('Invalid order book data');

    return data;
  } catch (error) {
    console.error(`Error fetching ${exchange} order book:`, error);
    return null;
  }
}

export async function fetchOHLCV(exchange: string, symbol: string, timeframe: string = '1m') {
  try {
    const { data, error } = await supabase.functions.invoke('ccxt-proxy', {
      body: { 
        exchange,
        symbol,
        method: 'fetchOHLCV',
        params: { timeframe }
      }
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error fetching ${exchange} OHLCV:`, error);
    return null;
  }
}

export async function fetchTrades(exchange: string, symbol: string) {
  try {
    const { data, error } = await supabase.functions.invoke('ccxt-proxy', {
      body: { 
        exchange,
        symbol,
        method: 'fetchTrades'
      }
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error fetching ${exchange} trades:`, error);
    return null;
  }
}

export async function fetchMarkets(exchange: string) {
  try {
    const { data, error } = await supabase.functions.invoke('ccxt-proxy', {
      body: { 
        exchange,
        method: 'fetchMarkets'
      }
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error fetching ${exchange} markets:`, error);
    return null;
  }
}

export async function fetchBalance(exchange: string) {
  try {
    const { data, error } = await supabase.functions.invoke('ccxt-proxy', {
      body: { 
        exchange,
        method: 'fetchBalance'
      }
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error fetching ${exchange} balance:`, error);
    return null;
  }
}

export async function createOrder(
  exchange: string,
  symbol: string,
  type: string,
  side: 'buy' | 'sell',
  amount: number,
  price?: number
) {
  try {
    const { data, error } = await supabase.functions.invoke('ccxt-proxy', {
      body: { 
        exchange,
        symbol,
        method: 'createOrder',
        params: { type, side, amount, price }
      }
    });

    if (error) throw error;
    return data as CCXTOrder;
  } catch (error) {
    console.error(`Error creating ${exchange} order:`, error);
    return null;
  }
}

export async function cancelOrder(exchange: string, orderId: string, symbol: string) {
  try {
    const { data, error } = await supabase.functions.invoke('ccxt-proxy', {
      body: { 
        exchange,
        symbol,
        method: 'cancelOrder',
        params: { orderId }
      }
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error canceling ${exchange} order:`, error);
    return null;
  }
}

export async function fetchOrders(exchange: string, symbol: string) {
  try {
    const { data, error } = await supabase.functions.invoke('ccxt-proxy', {
      body: { 
        exchange,
        symbol,
        method: 'fetchOrders'
      }
    });

    if (error) throw error;
    return data as CCXTOrder[];
  } catch (error) {
    console.error(`Error fetching ${exchange} orders:`, error);
    return null;
  }
}

export async function fetchOpenOrders(exchange: string, symbol: string) {
  try {
    const { data, error } = await supabase.functions.invoke('ccxt-proxy', {
      body: { 
        exchange,
        symbol,
        method: 'fetchOpenOrders'
      }
    });

    if (error) throw error;
    return data as CCXTOrder[];
  } catch (error) {
    console.error(`Error fetching ${exchange} open orders:`, error);
    return null;
  }
}