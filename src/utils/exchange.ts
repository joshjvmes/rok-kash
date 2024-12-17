import { fetchCoinbasePrice } from "./exchanges/coinbase";
import { fetchKrakenPrice } from "./exchanges/kraken";
import type { PriceCardProps } from "./types/exchange";

export { findArbitrageOpportunities } from "./exchanges/arbitrage";

export async function fetchPrices(symbols: string[]): Promise<PriceCardProps[]> {
  try {
    const pricesPromises = symbols.flatMap(async (symbol) => {
      const [coinbasePrice, krakenPrice] = await Promise.all([
        fetchCoinbasePrice(symbol),
        fetchKrakenPrice(symbol)
      ]);

      const results: PriceCardProps[] = [];
      if (coinbasePrice) {
        results.push({
          symbol,
          price: coinbasePrice.toFixed(2),
          change: parseFloat((Math.random() * 4 - 2).toFixed(2)), // Simulated for demo
          exchange: 'Coinbase'
        });
      }
      if (krakenPrice) {
        results.push({
          symbol,
          price: krakenPrice.toFixed(2),
          change: parseFloat((Math.random() * 4 - 2).toFixed(2)), // Simulated for demo
          exchange: 'Kraken'
        });
      }
      return results;
    });

    const prices = await Promise.all(pricesPromises);
    return prices.flat();
  } catch (error) {
    console.error('Error fetching prices:', error);
    return [];
  }
}