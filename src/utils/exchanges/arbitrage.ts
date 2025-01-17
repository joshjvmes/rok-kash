import { fetchCCXTPrice } from "./ccxt";
import { supabase } from "@/integrations/supabase/client";
import type { ArbitrageOpportunity } from "../types/exchange";

const EXCHANGES = ['binance', 'kucoin'];

async function getPriceForExchange(exchange: string, symbol: string): Promise<number | null> {
  try {
    console.log(`Fetching price for ${exchange} - ${symbol}`);
    let price: number | null = null;
    
    switch (exchange) {
      case 'binance':
        price = await fetchCCXTPrice('binance', symbol);
        break;
      case 'kucoin':
        price = await fetchCCXTPrice('kucoin', symbol);
        break;
    }

    if (price === null) {
      console.log(`No price returned for ${exchange} - ${symbol}`);
    } else {
      console.log(`Price for ${exchange} - ${symbol}: ${price}`);
    }

    return price;
  } catch (error) {
    console.error(`Error fetching price for ${exchange} - ${symbol}:`, error);
    return null;
  }
}

export async function findArbitrageOpportunities(symbol: string): Promise<ArbitrageOpportunity[]> {
  const opportunities: ArbitrageOpportunity[] = [];
  console.log(`Finding arbitrage opportunities for ${symbol}`);
  
  // Get all exchange prices in parallel
  const pricesPromises = EXCHANGES.map(exchange => getPriceForExchange(exchange, symbol));
  const prices = await Promise.all(pricesPromises);

  // Create a map of exchange prices
  const exchangeData = EXCHANGES.reduce((acc, exchange, index) => {
    if (prices[index] !== null) {
      acc[exchange] = {
        price: prices[index]
      };
    }
    return acc;
  }, {} as Record<string, { price: number | null }>);

  // Log the collected data
  console.log('Exchange data collected:', exchangeData);

  // Compare each pair of exchanges
  for (let i = 0; i < EXCHANGES.length; i++) {
    for (let j = i + 1; j < EXCHANGES.length; j++) {
      const buyExchange = EXCHANGES[i];
      const sellExchange = EXCHANGES[j];
      
      const buyData = exchangeData[buyExchange];
      const sellData = exchangeData[sellExchange];

      if (!buyData?.price || !sellData?.price) {
        console.log(`Skipping comparison for ${buyExchange}-${sellExchange} due to missing price data`);
        continue;
      }

      const buyPrice = buyData.price;
      const sellPrice = sellData.price;
      
      console.log(`Comparing ${buyExchange} (${buyPrice}) -> ${sellExchange} (${sellPrice})`);

      // Check both directions
      if (sellPrice > buyPrice) {
        const spread = ((sellPrice - buyPrice) / buyPrice) * 100;
        const potential = (sellPrice - buyPrice) * 1000; // Assuming 1000 units traded

        console.log(`Found opportunity: ${buyExchange} -> ${sellExchange}, spread: ${spread}%, potential: $${potential}`);

        if (spread >= 0.1) { // Only show opportunities with at least 0.1% spread
          opportunities.push({
            buyExchange: buyExchange.charAt(0).toUpperCase() + buyExchange.slice(1),
            sellExchange: sellExchange.charAt(0).toUpperCase() + sellExchange.slice(1),
            symbol,
            spread: parseFloat(spread.toFixed(2)),
            potential: parseFloat(potential.toFixed(2))
          });
        }
      }

      // Check reverse direction
      if (buyPrice > sellPrice) {
        const spread = ((buyPrice - sellPrice) / sellPrice) * 100;
        const potential = (buyPrice - sellPrice) * 1000; // Assuming 1000 units traded

        console.log(`Found reverse opportunity: ${sellExchange} -> ${buyExchange}, spread: ${spread}%, potential: $${potential}`);

        if (spread >= 0.1) {
          opportunities.push({
            buyExchange: sellExchange.charAt(0).toUpperCase() + sellExchange.slice(1),
            sellExchange: buyExchange.charAt(0).toUpperCase() + buyExchange.slice(1),
            symbol,
            spread: parseFloat(spread.toFixed(2)),
            potential: parseFloat(potential.toFixed(2))
          });
        }
      }
    }
  }

  // Store significant opportunities in the database
  for (const opportunity of opportunities) {
    if (opportunity.spread >= 0.5) { // Only store significant opportunities
      await supabase.from('price_discrepancies').insert({
        token_symbol: opportunity.symbol,
        exchange_from: opportunity.buyExchange.toLowerCase(),
        exchange_to: opportunity.sellExchange.toLowerCase(),
        price_difference_percentage: opportunity.spread,
        profitable_after_fees: true,
        potential_profit_usd: opportunity.potential
      });
    }
  }

  console.log(`Found ${opportunities.length} arbitrage opportunities`);
  return opportunities.sort((a, b) => b.spread - a.spread);
}