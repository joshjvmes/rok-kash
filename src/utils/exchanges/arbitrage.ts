import { fetchCCXTPrice } from "./ccxt";
import { fetchKrakenPrice } from "./kraken";
import { supabase } from "@/integrations/supabase/client";
import type { ArbitrageOpportunity } from "../types/exchange";

const EXCHANGES = ['kraken', 'bybit'];

// Hardcoded fixed fee rates
const FIXED_FEES = {
  kraken: 0.4,   // 0.4% trading fee
  bybit: 0.2     // 0.2% trading fee
};

async function getExchangeFee(exchangeName: string): Promise<number> {
  // Return hardcoded fees directly
  const fixedFee = FIXED_FEES[exchangeName as keyof typeof FIXED_FEES];
  console.log(`Using fixed fee for ${exchangeName}: ${fixedFee}%`);
  return fixedFee || 0.1; // Default to 0.1% if exchange not found
}

async function getPriceForExchange(exchange: string, symbol: string): Promise<number | null> {
  try {
    console.log(`Fetching price for ${exchange} - ${symbol}`);
    let price: number | null = null;
    
    switch (exchange) {
      case 'kraken':
        price = await fetchKrakenPrice(symbol);
        break;
      case 'bybit':
        price = await fetchCCXTPrice('bybit', symbol);
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
  
  // Get all exchange prices and fees in parallel
  const pricesPromises = EXCHANGES.map(exchange => getPriceForExchange(exchange, symbol));
  const feesPromises = EXCHANGES.map(exchange => getExchangeFee(exchange));
  
  const [prices, fees] = await Promise.all([
    Promise.all(pricesPromises),
    Promise.all(feesPromises)
  ]);

  // Create a map of exchange prices and fees
  const exchangeData = EXCHANGES.reduce((acc, exchange, index) => {
    if (prices[index] !== null) {
      acc[exchange] = {
        price: prices[index],
        fee: fees[index]
      };
    }
    return acc;
  }, {} as Record<string, { price: number | null; fee: number }>);

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

      // Calculate spread considering fees
      const buyPrice = buyData.price * (1 + buyData.fee / 100);
      const sellPrice = sellData.price * (1 - sellData.fee / 100);
      
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
      const reverseBuyPrice = sellData.price * (1 + sellData.fee / 100);
      const reverseSellPrice = buyData.price * (1 - buyData.fee / 100);

      console.log(`Comparing reverse ${sellExchange} (${reverseBuyPrice}) -> ${buyExchange} (${reverseSellPrice})`);

      if (reverseSellPrice > reverseBuyPrice) {
        const spread = ((reverseSellPrice - reverseBuyPrice) / reverseBuyPrice) * 100;
        const potential = (reverseSellPrice - reverseBuyPrice) * 1000; // Assuming 1000 units traded

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