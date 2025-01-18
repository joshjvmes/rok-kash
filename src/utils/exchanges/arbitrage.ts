import { supabase } from "@/integrations/supabase/client";
import type { ArbitrageOpportunity } from "../types/exchange";
import { getPriceForExchange } from "./priceUtils";
import { processOpportunity } from "./opportunityUtils";

export async function findArbitrageOpportunities(symbol: string): Promise<ArbitrageOpportunity[]> {
  const opportunities: ArbitrageOpportunity[] = [];
  console.log(`Finding arbitrage opportunities for ${symbol}`);
  
  // Get the trading pair from the database
  const { data: tradingPair } = await supabase
    .from('matching_trading_pairs')
    .select('*')
    .eq('symbol', symbol)
    .eq('is_active', true)
    .maybeSingle();

  if (!tradingPair) {
    console.log(`No active trading pair found for ${symbol}`);
    return opportunities;
  }

  // Get prices from both exchanges
  const binancePrice = await getPriceForExchange('binance', tradingPair.binance_symbol);
  const kucoinPrice = await getPriceForExchange('kucoin', tradingPair.kucoin_symbol);

  // Get the current user's ID
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.log('No authenticated user found');
    return opportunities;
  }

  // Get arbitrage settings for minimum thresholds
  const { data: settings } = await supabase
    .from('arbitrage_settings')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  const minSpreadPercentage = settings?.min_spread_percentage ?? 0.1;
  const minProfitAmount = settings?.min_profit_amount ?? 10.0;

  // Compare prices if both are available
  if (binancePrice && kucoinPrice) {
    // Check Binance -> Kucoin direction
    if (kucoinPrice > binancePrice) {
      const opportunity = await processOpportunity({
        buyExchange: 'Binance',
        sellExchange: 'Kucoin',
        symbol,
        buyPrice: binancePrice,
        sellPrice: kucoinPrice,
        minSpreadPercentage,
        minProfitAmount,
        userId: user.id
      });
      
      if (opportunity) {
        opportunities.push(opportunity);
      }
    }

    // Check Kucoin -> Binance direction
    if (binancePrice > kucoinPrice) {
      const opportunity = await processOpportunity({
        buyExchange: 'Kucoin',
        sellExchange: 'Binance',
        symbol,
        buyPrice: kucoinPrice,
        sellPrice: binancePrice,
        minSpreadPercentage,
        minProfitAmount,
        userId: user.id
      });
      
      if (opportunity) {
        opportunities.push(opportunity);
      }
    }
  }

  console.log(`Found ${opportunities.length} valid arbitrage opportunities that meet minimum requirements`);
  return opportunities;
}