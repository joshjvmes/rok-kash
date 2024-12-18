import { supabase } from "@/integrations/supabase/client";

export async function fetchCCXTPrice(exchange: string, symbol: string) {
  try {
    const { data, error } = await supabase.functions.invoke('ccxt-proxy', {
      body: { exchange, symbol }
    });

    if (error) {
      console.error('Error fetching CCXT price:', error);
      return null;
    }

    return data.price;
  } catch (error) {
    console.error('Error fetching CCXT price:', error);
    return null;
  }
}

export async function fetchOrderBook(exchange: string, symbol: string) {
  try {
    if (exchange === 'coinbase') {
      const { data, error } = await supabase.functions.invoke('coinbase-proxy', {
        body: { symbol, endpoint: 'orderbook' }
      });

      if (error) {
        console.error('Error fetching Coinbase order book:', error);
        return null;
      }

      // Transform Coinbase format to match our expected format
      return {
        bids: data.bids.map(([price, size]: string[]) => [parseFloat(price), parseFloat(size)]),
        asks: data.asks.map(([price, size]: string[]) => [parseFloat(price), parseFloat(size)])
      };
    }

    const { data, error } = await supabase.functions.invoke('ccxt-proxy', {
      body: { exchange, symbol, method: 'fetchOrderBook' }
    });

    if (error) {
      console.error('Error fetching order book:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching order book:', error);
    return null;
  }
}

export async function fetchTrades(exchange: string, symbol: string) {
  try {
    if (exchange === 'coinbase') {
      const { data, error } = await supabase.functions.invoke('coinbase-proxy', {
        body: { symbol, endpoint: 'trades' }
      });

      if (error) {
        console.error('Error fetching Coinbase trades:', error);
        return null;
      }

      // Transform Coinbase trades to match our expected format
      return data.map((trade: any) => ({
        id: trade.trade_id,
        timestamp: new Date(trade.time).getTime(),
        side: trade.side,
        price: parseFloat(trade.price),
        amount: parseFloat(trade.size)
      }));
    }

    const { data, error } = await supabase.functions.invoke('ccxt-proxy', {
      body: { exchange, symbol, method: 'fetchTrades' }
    });

    if (error) {
      console.error('Error fetching trades:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching trades:', error);
    return null;
  }
}

export async function fetchMarketStructure(exchange: string, symbol: string) {
  try {
    const { data, error } = await supabase.functions.invoke('ccxt-proxy', {
      body: { exchange, symbol, method: 'fetchMarket' }
    });

    if (error) {
      console.error('Error fetching market structure:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching market structure:', error);
    return null;
  }
}