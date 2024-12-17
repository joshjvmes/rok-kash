import { supabase } from "@/integrations/supabase/client";

interface CoinbasePrice {
  data: {
    base: string;
    currency: string;
    amount: string;
  };
}

interface KrakenPrice {
  result: {
    [key: string]: {
      c: string[];
    };
  };
}

async function fetchKrakenPrice(symbol: string) {
  try {
    const krakenSymbol = symbol.replace('/', '').replace('USD', 'ZUSD');
    const response = await fetch(`https://api.kraken.com/0/public/Ticker?pair=${krakenSymbol}`);
    const data: KrakenPrice = await response.json();
    const pair = Object.keys(data.result)[0];
    return parseFloat(data.result[pair].c[0]);
  } catch (error) {
    console.error('Error fetching Kraken price:', error);
    return null;
  }
}

async function fetchCoinbasePrice(symbol: string) {
  try {
    const [base] = symbol.split('/');
    const response = await fetch(`https://api.coinbase.com/v2/prices/${base}-USD/spot`);
    const data: CoinbasePrice = await response.json();
    return parseFloat(data.data.amount);
  } catch (error) {
    console.error('Error fetching Coinbase price:', error);
    return null;
  }
}

export async function fetchPrices(symbols: string[]) {
  try {
    const prices = await Promise.all(
      symbols.flatMap(async (symbol) => {
        const [coinbasePrice, krakenPrice] = await Promise.all([
          fetchCoinbasePrice(symbol),
          fetchKrakenPrice(symbol)
        ]);

        const results = [];
        if (coinbasePrice) {
          results.push({
            symbol,
            price: coinbasePrice.toFixed(2),
            change: (Math.random() * 4 - 2).toFixed(2), // Simulated for demo
            exchange: 'Coinbase'
          });
        }
        if (krakenPrice) {
          results.push({
            symbol,
            price: krakenPrice.toFixed(2),
            change: (Math.random() * 4 - 2).toFixed(2), // Simulated for demo
            exchange: 'Kraken'
          });
        }
        return results;
      }).flat()
    );

    return prices.filter(price => price !== null);
  } catch (error) {
    console.error('Error fetching prices:', error);
    return [];
  }
}

export async function findArbitrageOpportunities() {
  try {
    const symbols = ['BTC/USD', 'ETH/USD', 'SOL/USD'];
    const opportunities = [];

    for (const symbol of symbols) {
      const [coinbasePrice, krakenPrice] = await Promise.all([
        fetchCoinbasePrice(symbol),
        fetchKrakenPrice(symbol)
      ]);

      if (coinbasePrice && krakenPrice) {
        const priceDiff = ((Math.abs(coinbasePrice - krakenPrice) / Math.min(coinbasePrice, krakenPrice)) * 100);
        const spread = parseFloat(priceDiff.toFixed(2));
        
        if (spread > 0.1) { // Only show opportunities with >0.1% spread
          const buyExchange = coinbasePrice < krakenPrice ? 'Coinbase' : 'Kraken';
          const sellExchange = coinbasePrice < krakenPrice ? 'Kraken' : 'Coinbase';
          const potential = parseFloat((Math.abs(coinbasePrice - krakenPrice)).toFixed(2));

          // Store the opportunity in Supabase
          await supabase.from('price_discrepancies').insert({
            token_symbol: symbol,
            exchange_from: buyExchange,
            exchange_to: sellExchange,
            price_difference_percentage: spread,
            profitable_after_fees: spread > 0.2, // Assuming 0.2% total fees
            potential_profit_usd: potential
          });

          opportunities.push({
            buyExchange,
            sellExchange,
            symbol,
            spread,
            potential
          });
        }
      }
    }

    return opportunities;
  } catch (error) {
    console.error('Error finding arbitrage opportunities:', error);
    return [];
  }
}