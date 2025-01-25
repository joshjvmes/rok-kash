import { Exchange } from 'npm:ccxt';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const MIN_SPREAD_THRESHOLD = 0.05; // 0.05% minimum spread

interface PriceData {
  exchange: string;
  symbol: string;
  price: number | null;
}

export async function processBatch(
  symbols: string[],
  exchanges: Exchange[],
  supabase: any,
  userId: string | undefined
): Promise<any[]> {
  const opportunities = [];
  const batchSize = 5;

  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize);
    const batchPromises = batch.map(async (symbol) => {
      try {
        const tickerPromises = exchanges.map(exchange =>
          exchange.fetchTicker(symbol).catch(error => {
            console.error(`Error fetching ${exchange.id} ticker for ${symbol}:`, error.message);
            return null;
          })
        );

        const tickers = await Promise.all(tickerPromises);
        const validTickers = tickers.map((ticker, index) => ({
          exchange: exchanges[index].id,
          price: ticker?.last,
          symbol
        })).filter(t => t.price !== null && t.price !== undefined);

        // Compare prices between exchanges
        for (let i = 0; i < validTickers.length; i++) {
          for (let j = i + 1; j < validTickers.length; j++) {
            const buyExchange = validTickers[i];
            const sellExchange = validTickers[j];

            const spread = ((sellExchange.price - buyExchange.price) / buyExchange.price) * 100;
            const reversedSpread = ((buyExchange.price - sellExchange.price) / sellExchange.price) * 100;

            if (spread > MIN_SPREAD_THRESHOLD) {
              const potential = (sellExchange.price - buyExchange.price) * 100;
              const opportunity = {
                user_id: userId,
                buy_exchange: buyExchange.exchange,
                sell_exchange: sellExchange.exchange,
                symbol,
                spread: parseFloat(spread.toFixed(4)),
                potential_profit: parseFloat(potential.toFixed(2)),
                buy_price: buyExchange.price,
                sell_price: sellExchange.price,
                status: 'pending'
              };

              opportunities.push(opportunity);
              
              // Store in database
              await supabase
                .from('arbitrage_opportunities')
                .insert([opportunity])
                .catch(error => {
                  console.error('Error storing opportunity:', error);
                });
            }

            if (reversedSpread > MIN_SPREAD_THRESHOLD) {
              const potential = (buyExchange.price - sellExchange.price) * 100;
              const opportunity = {
                user_id: userId,
                buy_exchange: sellExchange.exchange,
                sell_exchange: buyExchange.exchange,
                symbol,
                spread: parseFloat(reversedSpread.toFixed(4)),
                potential_profit: parseFloat(potential.toFixed(2)),
                buy_price: sellExchange.price,
                sell_price: buyExchange.price,
                status: 'pending'
              };

              opportunities.push(opportunity);
              
              // Store in database
              await supabase
                .from('arbitrage_opportunities')
                .insert([opportunity])
                .catch(error => {
                  console.error('Error storing opportunity:', error);
                });
            }
          }
        }
      } catch (error) {
        console.error(`Error processing ${symbol}:`, error);
      }
    });

    await Promise.all(batchPromises);
    // Add delay between batches to prevent rate limiting
    if (i + batchSize < symbols.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  return opportunities;
}