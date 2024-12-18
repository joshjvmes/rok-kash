import { fetchCoinbasePrice } from "./exchanges/coinbase";
import { fetchKrakenPrice } from "./exchanges/kraken";
import { fetchCCXTPrice } from "./exchanges/ccxt";
import type { PriceCardProps } from "./types/exchange";

export { findArbitrageOpportunities } from "./exchanges/arbitrage";

const DEFAULT_SYMBOLS = [
  'BTC/USD', 'ETH/USD', 'SOL/USD', 'AVAX/USD', 'ADA/USD', 'XRP/USD',
  'PEPE/USD', 'SHI/USD', 'BONK/USD', 'FLOG/USD', 'BTTC/USD', 'MOG/USD'
];
const EXCHANGE_ORDER = ['Coinbase', 'Kraken', 'Bybit'];

export async function fetchPrices(): Promise<PriceCardProps[]> {
  try {
    const pricesPromises = DEFAULT_SYMBOLS.flatMap(async (symbol) => {
      // For new tokens that might not be available on all exchanges,
      // we'll handle potential null prices gracefully
      const [coinbasePrice, krakenPrice, bybitPrice] = await Promise.all([
        fetchCoinbasePrice(symbol).catch(() => null),
        fetchKrakenPrice(symbol).catch(() => null),
        fetchCCXTPrice('bybit', symbol).catch(() => null)
      ]);

      const results: PriceCardProps[] = [];
      
      // Add exchanges in specific order for each symbol
      if (coinbasePrice) {
        results.push({
          symbol,
          price: coinbasePrice.toFixed(2),
          change: parseFloat((Math.random() * 4 - 2).toFixed(2)),
          exchange: 'Coinbase'
        });
      }
      if (krakenPrice) {
        results.push({
          symbol,
          price: krakenPrice.toFixed(2),
          change: parseFloat((Math.random() * 4 - 2).toFixed(2)),
          exchange: 'Kraken'
        });
      }
      if (bybitPrice) {
        results.push({
          symbol,
          price: bybitPrice.toFixed(2),
          change: parseFloat((Math.random() * 4 - 2).toFixed(2)),
          exchange: 'Bybit'
        });
      }
      return results;
    });

    const prices = await Promise.all(pricesPromises);
    // Sort the flattened array to group by symbol and maintain exchange order
    return prices.flat().sort((a, b) => {
      if (a.symbol !== b.symbol) {
        return DEFAULT_SYMBOLS.indexOf(a.symbol) - DEFAULT_SYMBOLS.indexOf(b.symbol);
      }
      return EXCHANGE_ORDER.indexOf(a.exchange) - EXCHANGE_ORDER.indexOf(b.exchange);
    });
  } catch (error) {
    console.error('Error fetching prices:', error);
    return [];
  }
}