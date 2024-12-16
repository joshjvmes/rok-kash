import * as ccxt from 'ccxt';
import { supabase } from "@/integrations/supabase/client";

let exchange: ccxt.Exchange | null = null;

export async function initializeExchange() {
  try {
    const { data: { COINBASE_API_KEY } } = await supabase.functions.invoke('get-secret', {
      body: { name: 'COINBASE_API_KEY' }
    });

    if (!COINBASE_API_KEY) {
      console.error('Coinbase API key not found');
      return null;
    }

    exchange = new ccxt.coinbase({
      apiKey: COINBASE_API_KEY,
      enableRateLimit: true,
    });

    return exchange;
  } catch (error) {
    console.error('Error initializing exchange:', error);
    return null;
  }
}

export async function fetchPrices(symbols: string[]) {
  if (!exchange) {
    await initializeExchange();
  }
  
  try {
    const tickers = await Promise.all(
      symbols.map(async (symbol) => {
        const ticker = await exchange?.fetchTicker(symbol);
        return {
          symbol,
          price: ticker?.last?.toFixed(2) || '0',
          change: ticker?.percentage || 0,
          exchange: 'Coinbase'
        };
      })
    );
    return tickers;
  } catch (error) {
    console.error('Error fetching prices:', error);
    return [];
  }
}

export async function findArbitrageOpportunities() {
  if (!exchange) {
    await initializeExchange();
  }

  try {
    const markets = await exchange?.loadMarkets();
    const opportunities = [];
    const commonSymbols = ['BTC/USD', 'ETH/USD', 'SOL/USD'];

    for (const symbol of commonSymbols) {
      const orderbook = await exchange?.fetchOrderBook(symbol);
      if (orderbook) {
        const spread = ((orderbook.asks[0][0] - orderbook.bids[0][0]) / orderbook.bids[0][0]) * 100;
        
        if (spread > 0.1) { // Only show opportunities with >0.1% spread
          opportunities.push({
            buyExchange: 'Coinbase',
            sellExchange: 'Market',
            symbol,
            spread: parseFloat(spread.toFixed(2)),
            potential: parseFloat((spread * orderbook.bids[0][0] / 100).toFixed(2))
          });
        }
      }
    }

    return opportunities;
  } catch (error) {
    console.error('Error finding arbitrage opportunities:', error);
    return [];
  }
}