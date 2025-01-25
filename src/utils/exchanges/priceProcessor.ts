import { supabase } from "@/integrations/supabase/client";
import type { ArbitrageOpportunity } from "../types/exchange";
import type { ExchangePair } from "./scannerTypes";

export async function fetchPricesForSymbol(
  symbol: string,
  exchanges: string[]
): Promise<ExchangePair[]> {
  const pricePromises = exchanges.map(async (exchange) => {
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
  });

  return Promise.all(pricePromises);
}

export function findArbitrageOpportunities(
  symbolPrices: ExchangePair[],
  minSpreadPercentage: number
): ArbitrageOpportunity[] {
  const opportunities: ArbitrageOpportunity[] = [];
  
  for (let i = 0; i < symbolPrices.length; i++) {
    for (let j = i + 1; j < symbolPrices.length; j++) {
      const buyExchange = symbolPrices[i];
      const sellExchange = symbolPrices[j];

      if (!buyExchange.price || !sellExchange.price) continue;

      // Calculate spread percentage
      const spread = ((sellExchange.price - buyExchange.price) / buyExchange.price) * 100;
      const reversedSpread = ((buyExchange.price - sellExchange.price) / sellExchange.price) * 100;

      // Check if spread meets minimum threshold
      if (spread >= minSpreadPercentage) {
        const potential = (sellExchange.price - buyExchange.price) * 100;
        opportunities.push({
          buyExchange: buyExchange.exchange,
          sellExchange: sellExchange.exchange,
          symbol: buyExchange.symbol,
          spread: parseFloat(spread.toFixed(2)),
          potential: parseFloat(potential.toFixed(2))
        });
      }

      if (reversedSpread >= minSpreadPercentage) {
        const potential = (buyExchange.price - sellExchange.price) * 100;
        opportunities.push({
          buyExchange: sellExchange.exchange,
          sellExchange: buyExchange.exchange,
          symbol: buyExchange.symbol,
          spread: parseFloat(reversedSpread.toFixed(2)),
          potential: parseFloat(potential.toFixed(2))
        });
      }
    }
  }

  return opportunities;
}