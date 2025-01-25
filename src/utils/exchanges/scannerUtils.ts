import { supabase } from "@/integrations/supabase/client";
import type { Market, ScannerSettings } from "./scannerTypes";

export async function getExchangeSettings(userId: string) {
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

export async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function filterValidSymbols(markets: Market[], settings: ScannerSettings): Set<string> {
  const validSymbols = new Set<string>();
  const symbolCounts = new Map<string, number>();
  
  // Count occurrences of each symbol across exchanges
  markets.forEach(market => {
    if (!market.active) return;
    
    const count = symbolCounts.get(market.symbol) || 0;
    symbolCounts.set(market.symbol, count + 1);
  });

  // Only include symbols that exist on at least 2 exchanges
  symbolCounts.forEach((count, symbol) => {
    if (count >= 2) {
      // Apply user filters
      if (settings.included_symbols.length > 0) {
        if (settings.included_symbols.some(s => symbol.includes(s))) {
          validSymbols.add(symbol);
        }
      } else if (!settings.excluded_symbols.some(s => symbol.includes(s))) {
        validSymbols.add(symbol);
      }
    }
  });

  console.log(`Found ${validSymbols.size} valid symbols after filtering`);
  return validSymbols;
}

export async function fetchExchangeMarkets(exchange: string, delayMs: number): Promise<Market[]> {
  try {
    await delay(delayMs);

    const { data, error } = await supabase.functions.invoke('ccxt-proxy', {
      body: { 
        exchange: exchange.toLowerCase(), 
        method: 'fetchMarkets'
      }
    });

    if (error) {
      console.error(`Error fetching markets for ${exchange}:`, error);
      return [];
    }

    // Filter and transform the markets data
    return data
      .filter((market: any) => 
        market && 
        market.active && 
        market.type === 'spot' && 
        typeof market.symbol === 'string'
      )
      .map((market: any) => ({
        exchange,
        symbol: market.symbol,
        active: market.active
      }));
  } catch (error) {
    console.error(`Error processing markets for ${exchange}:`, error);
    return [];
  }
}