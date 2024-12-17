import { supabase } from "@/integrations/supabase/client";
import { fetchCoinbasePrice } from "./coinbase";
import { fetchKrakenPrice } from "./kraken";
import { fetchCCXTPrice } from "./ccxt";
import type { ArbitrageOpportunity } from "../types/exchange";

export async function findArbitrageOpportunities(): Promise<ArbitrageOpportunity[]> {
  try {
    const symbols = ['BTC/USD', 'ETH/USD', 'SOL/USD'];
    const opportunities: ArbitrageOpportunity[] = [];

    for (const symbol of symbols) {
      const [coinbasePrice, krakenPrice, bybitPrice] = await Promise.all([
        fetchCoinbasePrice(symbol),
        fetchKrakenPrice(symbol),
        fetchCCXTPrice('bybit', symbol)
      ]);

      const prices = [
        { exchange: 'Coinbase', price: coinbasePrice },
        { exchange: 'Kraken', price: krakenPrice },
        { exchange: 'Bybit', price: bybitPrice }
      ].filter(p => p.price !== null);

      for (let i = 0; i < prices.length; i++) {
        for (let j = i + 1; j < prices.length; j++) {
          const buyExchange = prices[i].price < prices[j].price ? prices[i].exchange : prices[j].exchange;
          const sellExchange = prices[i].price < prices[j].price ? prices[j].exchange : prices[i].exchange;
          const buyPrice = Math.min(prices[i].price, prices[j].price);
          const sellPrice = Math.max(prices[i].price, prices[j].price);
          
          const priceDiff = ((sellPrice - buyPrice) / buyPrice) * 100;
          const spread = parseFloat(priceDiff.toFixed(2));
          
          if (spread > 0.1) { // Only show opportunities with >0.1% spread
            const potential = parseFloat((sellPrice - buyPrice).toFixed(2));

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
    }

    return opportunities;
  } catch (error) {
    console.error('Error finding arbitrage opportunities:', error);
    return [];
  }
}