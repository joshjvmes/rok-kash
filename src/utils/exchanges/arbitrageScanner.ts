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

async function getExchangeSettings(userId: string) {
  const { data: settings } = await supabase
    .from('arbitrage_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  const { data: exchangeMetadata } = await supabase
    .from('exchange_metadata')
    .select('*');

  return { settings, exchangeMetadata };
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function scanArbitrageOpportunities(): Promise<ArbitrageOpportunity[]> {
  const opportunities: ArbitrageOpportunity[] = [];
  
  try {
    // Get the current user's ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('No authenticated user found');
      return opportunities;
    }

    // Get user settings and exchange metadata
    const { settings, exchangeMetadata } = await getExchangeSettings(user.id);
    if (!settings || !exchangeMetadata) {
      console.log('No settings or exchange metadata found');
      return opportunities;
    }

    const exchanges = settings.exchanges;
    console.log(`Scanning ${exchanges.length} exchanges:`, exchanges);

    // Fetch all available markets from each exchange with rate limiting
    const marketsPromises = exchanges.map(async (exchange, index) => {
      try {
        // Apply rate limiting delay
        await delay(index * (settings.request_delay_ms || 500));

        const { data, error } = await supabase.functions.invoke('ccxt-proxy', {
          body: { 
            exchange: exchange.toLowerCase(), 
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

    // Apply symbol filters from settings
    const validSymbols = new Set<string>();
    flatMarkets.forEach(market => {
      if (settings.included_symbols.length > 0) {
        if (settings.included_symbols.some(symbol => market.symbol.includes(symbol))) {
          validSymbols.add(market.symbol);
        }
      } else if (!settings.excluded_symbols.some(symbol => market.symbol.includes(symbol))) {
        validSymbols.add(market.symbol);
      }
    });

    console.log(`Found ${validSymbols.size} valid symbols after filtering`);

    // Process symbols in batches to respect rate limits
    const batchSize = settings.max_concurrent_requests || 5;
    const symbols = Array.from(validSymbols);

    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);
      
      const pricePromises = batch.flatMap(symbol => 
        exchanges.map(async (exchange) => {
          try {
            const { data, error } = await supabase.functions.invoke('ccxt-proxy', {
              body: { 
                exchange: exchange.toLowerCase(),
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
        })
      );

      const prices = await Promise.all(pricePromises);
      
      // Compare prices between exchanges
      for (const symbol of batch) {
        const symbolPrices = prices.filter(p => p.symbol === symbol && p.price !== null);
        
        for (let i = 0; i < symbolPrices.length; i++) {
          for (let j = i + 1; j < symbolPrices.length; j++) {
            const buyExchange = symbolPrices[i];
            const sellExchange = symbolPrices[j];

            if (!buyExchange.price || !sellExchange.price) continue;

            // Calculate spread percentage
            const spread = ((sellExchange.price - buyExchange.price) / buyExchange.price) * 100;
            const reversedSpread = ((buyExchange.price - sellExchange.price) / sellExchange.price) * 100;

            // Check if spread meets minimum threshold
            if (spread >= settings.min_spread_percentage) {
              const potential = (sellExchange.price - buyExchange.price) * 100; // Assuming 100 units traded
              opportunities.push({
                buyExchange: buyExchange.exchange,
                sellExchange: sellExchange.exchange,
                symbol,
                spread: parseFloat(spread.toFixed(2)),
                potential: parseFloat(potential.toFixed(2))
              });
            }

            if (reversedSpread >= settings.min_spread_percentage) {
              const potential = (buyExchange.price - sellExchange.price) * 100;
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

      // Add delay between batches
      if (i + batchSize < symbols.length) {
        await delay(settings.request_delay_ms || 500);
      }
    }

    // Sort opportunities by spread
    return opportunities.sort((a, b) => b.spread - a.spread);
  } catch (error) {
    console.error('Error in scanArbitrageOpportunities:', error);
    return [];
  }
}