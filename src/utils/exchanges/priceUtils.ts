import { supabase } from "@/integrations/supabase/client";
import { fetchCCXTPrice } from "./ccxt";

export async function getPriceForExchange(exchange: string, symbol: string): Promise<number | null> {
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