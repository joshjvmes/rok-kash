import { supabase } from "@/integrations/supabase/client";
import type { ArbitrageOpportunity } from "../types/exchange";

interface ExchangePair {
  exchange: string;
  symbol: string;
  price: number | null;
}

interface Market {
  exchange: string;
  symbol: string;
  active: boolean;
}

export async function scanArbitrageOpportunities(): Promise<ArbitrageOpportunity[]> {
  const opportunities: ArbitrageOpportunity[] = [];
  const exchanges = ['coinbase', 'kraken', 'bybit', 'binance', 'kucoin', 'okx'];
  
  try {
    // Fetch all available markets from each exchange
    const marketsPromises = exchanges.map(async (exchange) => {
      try {
        const { data, error } = await supabase.functions.invoke('ccxt-proxy', {
          body: { 
            exchange, 
            method: 'fetchMarkets'
          }
        });

        if (error) {
          console.log(`Error fetching markets for ${exchange}:`, error);
          return [];
        }

        return data.map((market: any) => ({
          exchange,
          symbol: market.symbol,
          active: market.active
        }));
      } catch (error) {
        console.log(`Error processing markets for ${exchange}:`, error);
        return [];
      }
    });

    const allMarkets = await Promise.all(marketsPromises);
    const flatMarkets = allMarkets.flat() as Market[];

    // Get unique symbols that are available on at least 2 exchanges
    const symbolCounts = flatMarkets.reduce<Record<string, string[]>>((acc, market) => {
      if (!acc[market.symbol]) {
        acc[market.symbol] = [];
      }
      if (!acc[market.symbol].includes(market.exchange)) {
        acc[market.symbol].push(market.exchange);
      }
      return acc;
    }, {});

    const validSymbols = Object.entries(symbolCounts)
      .filter(([_, exchanges]) => exchanges.length >= 2)
      .map(([symbol]) => symbol);

    console.log(`Found ${validSymbols.length} valid symbols for arbitrage scanning`);

    // Fetch prices for each valid symbol from all exchanges
    for (const symbol of validSymbols) {
      const pricesPromises = exchanges.map(async (exchange) => {
        // Only fetch price if the exchange supports this symbol
        if (!symbolCounts[symbol].includes(exchange)) {
          return { exchange, symbol, price: null };
        }

        try {
          const { data, error } = await supabase.functions.invoke('ccxt-proxy', {
            body: { 
              exchange, 
              symbol,
              method: 'fetchTicker'
            }
          });

          if (error) {
            console.log(`Error fetching price for ${symbol} on ${exchange}:`, error);
            return { exchange, symbol, price: null };
          }

          return {
            exchange,
            symbol,
            price: data?.last || null
          };
        } catch (error) {
          console.log(`Error processing price for ${symbol} on ${exchange}:`, error);
          return { exchange, symbol, price: null };
        }
      });

      const prices = await Promise.all(pricesPromises);
      const validPrices = prices.filter(p => p.price !== null);

      if (validPrices.length < 2) {
        console.log(`Not enough valid prices for ${symbol}, skipping...`);
        continue;
      }

      // Compare prices between exchanges
      for (let i = 0; i < validPrices.length; i++) {
        for (let j = i + 1; j < validPrices.length; j++) {
          const buyExchange = validPrices[i];
          const sellExchange = validPrices[j];

          if (!buyExchange.price || !sellExchange.price) continue;

          // Calculate spread percentage
          const spread = ((sellExchange.price - buyExchange.price) / buyExchange.price) * 100;
          const reversedSpread = ((buyExchange.price - sellExchange.price) / sellExchange.price) * 100;

          // Check both directions for any positive spread
          if (spread > 0) {
            const potential = (sellExchange.price - buyExchange.price) * 100; // Assuming 100 units traded
            opportunities.push({
              buyExchange: buyExchange.exchange,
              sellExchange: sellExchange.exchange,
              symbol,
              spread: parseFloat(spread.toFixed(2)),
              potential: parseFloat(potential.toFixed(2))
            });
          }

          if (reversedSpread > 0) {
            const potential = (buyExchange.price - sellExchange.price) * 100; // Assuming 100 units traded
            opportunities.push({
              buyExchange: sellExchange.exchange,
              sellExchange: buyExchange.exchange,
              symbol,
              spread: parseFloat(reversedSpread.toFixed(2)),
              potential: parseFloat(potential.toFixed(2))
            });
          }
        }
      }
    }

    // Sort opportunities by spread
    return opportunities.sort((a, b) => b.spread - a.spread);
  } catch (error) {
    console.error('Error in scanArbitrageOpportunities:', error);
    return [];
  }
}