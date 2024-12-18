import { fetchCCXTPrice } from "./ccxt";
import { fetchCoinbasePrice } from "./coinbase";
import { fetchKrakenPrice } from "./kraken";
import { supabase } from "@/integrations/supabase/client";
import type { ArbitrageOpportunity } from "../types/exchange";

const EXCHANGES = ['coinbase', 'kraken', 'bybit'];

async function getExchangeFee(exchangeName: string): Promise<number> {
  const { data: metadata } = await supabase
    .from('exchange_metadata')
    .select('trading_fee_percentage')
    .eq('exchange_name', exchangeName)
    .single();
  
  return metadata?.trading_fee_percentage || 0.1; // Default to 0.1% if not found
}

async function getPriceForExchange(exchange: string, symbol: string): Promise<number | null> {
  try {
    switch (exchange) {
      case 'coinbase':
        return await fetchCoinbasePrice(symbol);
      case 'kraken':
        return await fetchKrakenPrice(symbol);
      case 'bybit':
        return await fetchCCXTPrice('bybit', symbol);
      default:
        return null;
    }
  } catch (error) {
    console.error(`Error fetching price for ${exchange}:`, error);
    return null;
  }
}

export async function findArbitrageOpportunities(symbol: string): Promise<ArbitrageOpportunity[]> {
  const opportunities: ArbitrageOpportunity[] = [];
  
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

  // Compare each pair of exchanges
  for (let i = 0; i < EXCHANGES.length; i++) {
    for (let j = i + 1; j < EXCHANGES.length; j++) {
      const buyExchange = EXCHANGES[i];
      const sellExchange = EXCHANGES[j];
      
      const buyData = exchangeData[buyExchange];
      const sellData = exchangeData[sellExchange];

      if (!buyData?.price || !sellData?.price) continue;

      // Calculate spread considering fees
      const buyPrice = buyData.price * (1 + buyData.fee / 100);
      const sellPrice = sellData.price * (1 - sellData.fee / 100);
      
      // Check both directions
      if (sellPrice > buyPrice) {
        const spread = ((sellPrice - buyPrice) / buyPrice) * 100;
        const potential = (sellPrice - buyPrice) * 1000; // Assuming 1000 units traded

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

      if (reverseSellPrice > reverseBuyPrice) {
        const spread = ((reverseSellPrice - reverseBuyPrice) / reverseBuyPrice) * 100;
        const potential = (reverseSellPrice - reverseBuyPrice) * 1000; // Assuming 1000 units traded

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

  return opportunities.sort((a, b) => b.spread - a.spread);
}