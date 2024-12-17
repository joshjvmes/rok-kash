import { fetchCoinbasePrice } from "./exchanges/coinbase";
import { fetchKrakenPrice } from "./exchanges/kraken";
import { fetchCCXTPrice } from "./exchanges/ccxt";
import type { PriceCardProps } from "./types/exchange";

export { findArbitrageOpportunities } from "./exchanges/arbitrage";

export async function fetchPrices(symbols: string[]): Promise<PriceCardProps[]> {
  try {
    const pricesPromises = symbols.flatMap(async (symbol) => {
      const [coinbasePrice, krakenPrice, bybitPrice] = await Promise.all([
        fetchCoinbasePrice(symbol),
        fetchKrakenPrice(symbol),
        fetchCCXTPrice('bybit', symbol)
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
      if (bybitPrice) {
        results.push({
          symbol,
          price: bybitPrice.toFixed(2),
          change: parseFloat((Math.random() * 4 - 2).toFixed(2)), // Simulated for demo
          exchange: 'Bybit'
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