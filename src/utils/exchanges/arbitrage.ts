import { fetchCCXTPrice } from "./ccxt";
import { supabase } from "@/integrations/supabase/client";
import type { ArbitrageOpportunity } from "../types/exchange";

async function getPriceForExchange(exchange: string, symbol: string): Promise<number | null> {
  try {
    console.log(`Fetching price for ${exchange} - ${symbol}`);
    const startTime = performance.now();
    let price: number | null = null;
    
    switch (exchange) {
      case 'binance':
        price = await fetchCCXTPrice('binance', symbol);
        break;
      case 'kucoin':
        price = await fetchCCXTPrice('kucoin', symbol);
        break;
    }

    const executionTime = Math.round(performance.now() - startTime);

    if (price === null) {
      console.log(`No price returned for ${exchange} - ${symbol}`);
    } else {
      console.log(`Price for ${exchange} - ${symbol}: ${price}`);
      
      // Update execution time in the database
      await supabase
        .from('matching_trading_pairs')
        .update({ 
          average_execution_time_ms: executionTime,
          last_price_check: new Date().toISOString()
        })
        .eq('symbol', symbol);
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

  // Create a map of exchange prices
  const exchangeData: Record<string, { price: number | null }> = {
    binance: { price: binancePrice },
    kucoin: { price: kucoinPrice }
  };

  // Log the collected data
  console.log('Exchange data collected:', exchangeData);

  // Compare prices if both are available
  if (binancePrice && kucoinPrice) {
    // Check Binance -> Kucoin direction
    if (kucoinPrice > binancePrice) {
      const spread = ((kucoinPrice - binancePrice) / binancePrice) * 100;
      const potential = (kucoinPrice - binancePrice) * 1000; // Assuming 1000 units traded

      console.log(`Found opportunity: binance -> kucoin, spread: ${spread}%, potential: $${potential}`);

      if (spread >= 0.1) { // Only show opportunities with at least 0.1% spread
        opportunities.push({
          buyExchange: 'Binance',
          sellExchange: 'Kucoin',
          symbol,
          spread: parseFloat(spread.toFixed(2)),
          potential: parseFloat(potential.toFixed(2))
        });

        // Update average price difference in the database
        await supabase
          .from('matching_trading_pairs')
          .update({ 
            average_price_difference: spread
          })
          .eq('symbol', symbol);
      }
    }

    // Check Kucoin -> Binance direction
    if (binancePrice > kucoinPrice) {
      const spread = ((binancePrice - kucoinPrice) / kucoinPrice) * 100;
      const potential = (binancePrice - kucoinPrice) * 1000;

      console.log(`Found reverse opportunity: kucoin -> binance, spread: ${spread}%, potential: $${potential}`);

      if (spread >= 0.1) {
        opportunities.push({
          buyExchange: 'Kucoin',
          sellExchange: 'Binance',
          symbol,
          spread: parseFloat(spread.toFixed(2)),
          potential: parseFloat(potential.toFixed(2))
        });

        // Update average price difference in the database
        await supabase
          .from('matching_trading_pairs')
          .update({ 
            average_price_difference: spread
          })
          .eq('symbol', symbol);
      }
    }
  }

  console.log(`Found ${opportunities.length} arbitrage opportunities`);
  return opportunities.sort((a, b) => b.spread - a.spread);
}