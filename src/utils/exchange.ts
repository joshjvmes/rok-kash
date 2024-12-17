import { fetchCoinbasePrice } from "./exchanges/coinbase";
import { fetchKrakenPrice } from "./exchanges/kraken";
import type { PriceCardProps } from "./types/exchange";

export { findArbitrageOpportunities } from "./exchanges/arbitrage";

/**
 * Fetches current prices for specified symbols from multiple exchanges
 * @param symbols Array of trading pairs (e.g., ['BTC/USD'])
 * @returns Array of price data for each symbol/exchange combination
 */
export async function fetchPrices(symbols: string[]): Promise<PriceCardProps[]> {
  try {
    const pricesPromises = symbols.flatMap(async (symbol) => {
      try {
        const [coinbasePrice, krakenPrice] = await Promise.allSettled([
          fetchCoinbasePrice(symbol),
          fetchKrakenPrice(symbol)
        ]);

        const results: PriceCardProps[] = [];
        
        if (coinbasePrice.status === 'fulfilled' && coinbasePrice.value) {
          results.push({
            symbol,
            price: coinbasePrice.value.toFixed(2),
            change: parseFloat((Math.random() * 4 - 2).toFixed(2)), // Simulated for demo
            exchange: 'Coinbase'
          });
        }

        if (krakenPrice.status === 'fulfilled' && krakenPrice.value) {
          results.push({
            symbol,
            price: krakenPrice.value.toFixed(2),
            change: parseFloat((Math.random() * 4 - 2).toFixed(2)), // Simulated for demo
            exchange: 'Kraken'
          });
        }

        return results;
      } catch (error) {
        console.error(`Error fetching prices for ${symbol}:`, error);
        return [];
      }
    });

    const prices = await Promise.all(pricesPromises);
    return prices.flat();
  } catch (error) {
    console.error('Error fetching prices:', error);
    return [];
  }
}