import { fetchCoinbasePrice } from "./exchanges/coinbase";
import { fetchKrakenPrice } from "./exchanges/kraken";
import { fetchCCXTPrice } from "./exchanges/ccxt";
import type { PriceCardProps } from "./types/exchange";

export { findArbitrageOpportunities } from "./exchanges/arbitrage";

const DEFAULT_SYMBOLS = [
  'BTC/USD', 'ETH/USD', 'SOL/USD', 
  'PEPE/USD', 'BONK/USD', 'MOG/USD',
  'AVAX/USD', 'ADA/USD', 'XRP/USD'
];

const EXCHANGE_ORDER = ['Coinbase', 'Kraken', 'Bybit', 'Binance'];

export async function fetchPrices(): Promise<PriceCardProps[]> {
  try {
    const pricesPromises = DEFAULT_SYMBOLS.flatMap(async (symbol) => {
      // Special handling for MOG on Binance
      const binanceSymbol = symbol === 'MOG/USD' ? 'MOG/USDT' : symbol.replace('/USD', '/USDT');

      const [coinbasePrice, krakenPrice, bybitPrice, binancePrice] = await Promise.allSettled([
        fetchCoinbasePrice(symbol).catch((error) => {
          console.error(`Error fetching Coinbase price for ${symbol}:`, error);
          return null;
        }),
        fetchKrakenPrice(symbol).catch((error) => {
          console.error(`Error fetching Kraken price for ${symbol}:`, error);
          return null;
        }),
        fetchCCXTPrice('bybit', symbol.replace('/USD', '/USDT')).catch((error) => {
          console.error(`Error fetching Bybit price for ${symbol}:`, error);
          return null;
        }),
        fetchCCXTPrice('binance', binanceSymbol).catch((error) => {
          console.error(`Error fetching Binance price for ${symbol}:`, error);
          return null;
        })
      ]);

      const results: PriceCardProps[] = [];
      
      if (coinbasePrice.status === 'fulfilled' && coinbasePrice.value) {
        results.push({
          symbol,
          price: coinbasePrice.value.toFixed(2),
          change: parseFloat((Math.random() * 4 - 2).toFixed(2)),
          exchange: 'Coinbase'
        });
      }

      if (krakenPrice.status === 'fulfilled' && krakenPrice.value) {
        results.push({
          symbol,
          price: krakenPrice.value.toFixed(2),
          change: parseFloat((Math.random() * 4 - 2).toFixed(2)),
          exchange: 'Kraken'
        });
      }

      if (bybitPrice.status === 'fulfilled' && bybitPrice.value) {
        results.push({
          symbol,
          price: bybitPrice.value.toFixed(2),
          change: parseFloat((Math.random() * 4 - 2).toFixed(2)),
          exchange: 'Bybit'
        });
      }

      if (binancePrice.status === 'fulfilled' && binancePrice.value) {
        results.push({
          symbol: symbol, // Display as MOG/USD even though we fetch MOG/USDT
          price: binancePrice.value.toFixed(2),
          change: parseFloat((Math.random() * 4 - 2).toFixed(2)),
          exchange: 'Binance'
        });
      }

      return results;
    });

    const prices = await Promise.all(pricesPromises);
    return prices.flat().sort((a, b) => {
      if (a.symbol !== b.symbol) {
        const aBase = a.symbol.split('/')[0];
        const bBase = b.symbol.split('/')[0];
        const aIndex = DEFAULT_SYMBOLS.findIndex(s => s.startsWith(aBase + '/'));
        const bIndex = DEFAULT_SYMBOLS.findIndex(s => s.startsWith(bBase + '/'));
        return aIndex - bIndex;
      }
      return EXCHANGE_ORDER.indexOf(a.exchange) - EXCHANGE_ORDER.indexOf(b.exchange);
    });
  } catch (error) {
    console.error('Error fetching prices:', error);
    return [];
  }
}