import { supabase } from "@/integrations/supabase/client";

export async function fetchCCXTPrice(exchange: string, symbol: string) {
  try {
    const { data, error } = await supabase.functions.invoke('ccxt-proxy', {
      body: { exchange: exchange.toLowerCase(), symbol, method: 'fetchTicker' }
    });

    if (error) {
      console.error(`Error fetching ${exchange} price:`, error);
      return null;
    }

    return data?.last || null;
  } catch (error) {
    console.error(`Error fetching ${exchange} price:`, error);
    return null;
  }
}

export async function fetchOrderBook(exchange: string, symbol: string) {
  try {
    const { data, error } = await supabase.functions.invoke('ccxt-proxy', {
      body: { exchange: exchange.toLowerCase(), symbol, method: 'fetchOrderBook' }
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

export async function fetchTrades(exchange: string, symbol: string) {
  try {
    const { data, error } = await supabase.functions.invoke('ccxt-proxy', {
      body: { exchange: exchange.toLowerCase(), symbol, method: 'fetchTrades' }
    });

    if (error) {
      console.error(`Error fetching ${exchange} trades:`, error);
      return null;
    }

    return data;
  } catch (error) {
    console.error(`Error fetching ${exchange} trades:`, error);
    return null;
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
        exchange: exchange.toLowerCase(),
        symbol,
        method: 'createOrder',
        params
      }
    });

    if (error) {
      console.error(`Error creating order on ${exchange}:`, error);
      throw error;
    }

    if (!data || !data.id) {
      throw new Error('Order creation failed - no order ID received');
    }

    console.log(`Successfully created order on ${exchange}:`, data);
    return data;
  } catch (error) {
    console.error(`Error creating order on ${exchange}:`, error);
    throw error;
  }
}

export async function cancelOrder(exchange: string, orderId: string, symbol: string) {
  try {
    console.log(`Cancelling order ${orderId} on ${exchange}`);
    
    const { data, error } = await supabase.functions.invoke('ccxt-proxy', {
      body: {
        exchange: exchange.toLowerCase(),
        method: 'cancelOrder',
        params: {
          id: orderId,
          symbol: symbol
        }
      }
    });

    if (error) {
      console.error(`Error cancelling order on ${exchange}:`, error);
      throw error;
    }

    console.log(`Successfully cancelled order on ${exchange}:`, data);
    return data;
  } catch (error) {
    console.error(`Error cancelling order on ${exchange}:`, error);
    throw error;
  }
}

export async function fetchBalance(exchange: string) {
  try {
    console.log(`Fetching balance for ${exchange}...`);
    
    const { data, error } = await supabase.functions.invoke('ccxt-proxy', {
      body: { exchange: exchange.toLowerCase(), method: 'fetchBalance' }
    });

    if (error) {
      console.error(`Error fetching ${exchange} balance:`, error);
      return null;
    }

    console.log(`Successfully fetched ${exchange} balance:`, data);
    return data;
  } catch (error) {
    console.error(`Error fetching ${exchange} balance:`, error);
    return null;
  }
}

export async function fetchMarketStructure(exchange: string, symbol: string) {
  try {
    const { data, error } = await supabase.functions.invoke('ccxt-proxy', {
      body: { exchange: exchange.toLowerCase(), symbol, method: 'fetchMarket' }
    });

    if (error) {
      console.error(`Error fetching ${exchange} market structure:`, error);
      return null;
    }

    return data;
  } catch (error) {
    console.error(`Error fetching ${exchange} market structure:`, error);
    return null;
  }
}