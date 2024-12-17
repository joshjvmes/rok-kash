import { supabase } from "@/integrations/supabase/client";
import { fetchCoinbasePrice } from "./coinbase";
import { fetchKrakenPrice } from "./kraken";
import type { ArbitrageOpportunity } from "../types/exchange";

export async function findArbitrageOpportunities(): Promise<ArbitrageOpportunity[]> {
  try {
    const symbols = ['BTC/USD', 'ETH/USD', 'SOL/USD'];
    const opportunities: ArbitrageOpportunity[] = [];

    for (const symbol of symbols) {
      const [coinbasePrice, krakenPrice] = await Promise.all([
        fetchCoinbasePrice(symbol),
        fetchKrakenPrice(symbol)
      ]);

      if (coinbasePrice && krakenPrice) {
        const priceDiff = ((Math.abs(coinbasePrice - krakenPrice) / Math.min(coinbasePrice, krakenPrice)) * 100);
        const spread = parseFloat(priceDiff.toFixed(2));
        
        if (spread > 0.1) { // Only show opportunities with >0.1% spread
          const buyExchange = coinbasePrice < krakenPrice ? 'Coinbase' : 'Kraken';
          const sellExchange = coinbasePrice < krakenPrice ? 'Kraken' : 'Coinbase';
          const potential = parseFloat((Math.abs(coinbasePrice - krakenPrice)).toFixed(2));

          // Store the opportunity in Supabase
          await supabase.from('price_discrepancies').insert({
            token_symbol: symbol,
            exchange_from: buyExchange,
            exchange_to: sellExchange,
            price_difference_percentage: spread,
            profitable_after_fees: spread > 0.2, // Assuming 0.2% total fees
            potential_profit_usd: potential
          });

          opportunities.push({
            buyExchange,
            sellExchange,
            symbol,
            spread,
            potential
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