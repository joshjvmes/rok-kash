import { supabase } from "@/integrations/supabase/client";
import type { ArbitrageOpportunity } from "../types/exchange";
import { 
  getExchangeSettings, 
  delay, 
  filterValidSymbols,
  fetchExchangeMarkets 
} from "./scannerUtils";
import { 
  fetchPricesForSymbol,
  findArbitrageOpportunities 
} from "./priceProcessor";

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
    const marketsPromises = exchanges.map((exchange, index) => 
      fetchExchangeMarkets(exchange, index * (settings.request_delay_ms || 500))
    );

    const allMarkets = await Promise.all(marketsPromises);
    const flatMarkets = allMarkets.flat();

    // Apply symbol filters from settings
    const validSymbols = filterValidSymbols(flatMarkets, settings);
    console.log(`Found ${validSymbols.size} valid symbols after filtering`);

    // Process symbols in batches to respect rate limits
    const batchSize = settings.max_concurrent_requests || 5;
    const symbols = Array.from(validSymbols);

    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);
      
      for (const symbol of batch) {
        const prices = await fetchPricesForSymbol(symbol, exchanges);
        const symbolPrices = prices.filter(p => p.price !== null);
        
        const symbolOpportunities = findArbitrageOpportunities(
          symbolPrices,
          settings.min_spread_percentage
        );
        
        opportunities.push(...symbolOpportunities);
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