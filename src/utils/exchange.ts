import { fetchKrakenPrice } from "./exchanges/kraken";
import { fetchCCXTPrice } from "./exchanges/ccxt";
import type { PriceCardProps } from "./types/exchange";

export { findArbitrageOpportunities } from "./exchanges/arbitrage";

// Match the symbols used in the UI
const DEFAULT_SYMBOLS = [
  'BTC/USDC', 'ETH/USDC', 'SOL/USDC', 
  'PEPE/USDC', 'BONK/USDC', 'MOG/USDC',
  'AVAX/USDC'
];

const EXCHANGE_ORDER = ['Kraken', 'Bybit', 'Binance', 'Kucoin', 'OKX'];

export async function fetchPrices(): Promise<PriceCardProps[]> {
  try {
    const pricesPromises = DEFAULT_SYMBOLS.flatMap(async (symbol) => {
      // Convert to USD pair for exchanges that require it
      const usdSymbol = symbol.replace('/USDC', '/USD');
      // Convert to USDT pair for Binance, Kucoin and OKX
      const usdtSymbol = symbol.replace('/USDC', '/USDT');

      console.log(`Fetching prices for ${symbol}`);
      console.log(`Using USD symbol: ${usdSymbol} for some exchanges`);
      console.log(`Using USDT symbol: ${usdtSymbol} for Binance, Kucoin and OKX`);

      const [krakenPrice, bybitPrice, binancePrice, kucoinPrice, okxPrice] = await Promise.allSettled([
        fetchKrakenPrice(usdSymbol).catch((error) => {
          console.error(`Error fetching Kraken price for ${usdSymbol}:`, error);
          return null;
        }),
        fetchCCXTPrice('bybit', usdSymbol).catch((error) => {
          console.error(`Error fetching Bybit price for ${usdSymbol}:`, error);
          return null;
        }),
        fetchCCXTPrice('binance', usdtSymbol).catch((error) => {
          console.error(`Error fetching Binance price for ${usdtSymbol}:`, error);
          return null;
        }),
        fetchCCXTPrice('kucoin', usdtSymbol).catch((error) => {
          console.error(`Error fetching Kucoin price for ${usdtSymbol}:`, error);
          return null;
        }),
        fetchCCXTPrice('okx', usdtSymbol).catch((error) => {
          console.error(`Error fetching OKX price for ${usdtSymbol}:`, error);
          return null;
        })
      ]);

      const results: PriceCardProps[] = [];
      
      // Always use the original USDC symbol for consistency in the UI
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
          symbol,
          price: binancePrice.value.toFixed(2),
          change: parseFloat((Math.random() * 4 - 2).toFixed(2)),
          exchange: 'Binance'
        });
      }

      if (kucoinPrice.status === 'fulfilled' && kucoinPrice.value) {
        results.push({
          symbol,
          price: kucoinPrice.value.toFixed(2),
          change: parseFloat((Math.random() * 4 - 2).toFixed(2)),
          exchange: 'Kucoin'
        });
      }

      if (okxPrice.status === 'fulfilled' && okxPrice.value) {
        results.push({
          symbol,
          price: okxPrice.value.toFixed(2),
          change: parseFloat((Math.random() * 4 - 2).toFixed(2)),
          exchange: 'OKX'
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