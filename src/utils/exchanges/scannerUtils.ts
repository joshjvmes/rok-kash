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
  
  markets.forEach(market => {
    if (settings.included_symbols.length > 0) {
      if (settings.included_symbols.some(symbol => market.symbol.includes(symbol))) {
        validSymbols.add(market.symbol);
      }
    } else if (!settings.excluded_symbols.some(symbol => market.symbol.includes(symbol))) {
      validSymbols.add(market.symbol);
    }
  });

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
}