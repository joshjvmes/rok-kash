import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import ccxt from 'npm:ccxt'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbols = ['BTC/USDT'] } = await req.json();
    const opportunities = [];
    
    console.log('Starting price comparison for symbols:', symbols);

    // Initialize exchange instances
    const binance = new ccxt.binance({
      enableRateLimit: true,
      timeout: 30000,
    });

    const kucoin = new ccxt.kucoin({
      enableRateLimit: true,
      timeout: 30000,
    });

    // Configure API credentials if available
    if (Deno.env.get('BINANCE_API_KEY')) {
      binance.apiKey = Deno.env.get('BINANCE_API_KEY');
      binance.secret = Deno.env.get('BINANCE_SECRET');
    }

    if (Deno.env.get('KUCOIN_API_KEY')) {
      kucoin.apiKey = Deno.env.get('KUCOIN_API_KEY');
      kucoin.secret = Deno.env.get('KUCOIN_SECRET');
      kucoin.password = Deno.env.get('KUCOIN_PASSPHRASE');
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Load markets for both exchanges
    console.log('Loading markets...');
    await Promise.all([
      binance.loadMarkets(),
      kucoin.loadMarkets()
    ]);

    // Process each symbol
    for (const symbol of symbols) {
      try {
        console.log(`Fetching prices for ${symbol}`);
        
        // Fetch tickers simultaneously
        const [binanceTicker, kucoinTicker] = await Promise.all([
          binance.fetchTicker(symbol).catch(error => {
            console.error(`Error fetching Binance ticker for ${symbol}:`, error.message);
            return null;
          }),
          kucoin.fetchTicker(symbol).catch(error => {
            console.error(`Error fetching Kucoin ticker for ${symbol}:`, error.message);
            return null;
          })
        ]);

        if (!binanceTicker || !kucoinTicker) {
          console.log(`Skipping ${symbol} - missing ticker data`);
          continue;
        }

        const binancePrice = binanceTicker.last;
        const kucoinPrice = kucoinTicker.last;

        if (!binancePrice || !kucoinPrice) {
          console.log(`Skipping ${symbol} - invalid prices`);
          continue;
        }

        // Calculate spreads in both directions
        const binanceToKucoinSpread = ((kucoinPrice - binancePrice) / binancePrice) * 100;
        const kucoinToBinanceSpread = ((binancePrice - kucoinPrice) / kucoinPrice) * 100;

        const timestamp = new Date().toISOString();

        // Check Binance -> Kucoin direction
        if (binanceToKucoinSpread > 0) {
          const opportunity = {
            buyExchange: 'Binance',
            sellExchange: 'Kucoin',
            symbol,
            spread: parseFloat(binanceToKucoinSpread.toFixed(4)),
            potential: parseFloat((kucoinPrice - binancePrice).toFixed(2)),
            timestamp,
            buyPrice: binancePrice,
            sellPrice: kucoinPrice
          };
          opportunities.push(opportunity);

          // Store in database
          await supabase.from('arbitrage_opportunities').insert([{
            buy_exchange: opportunity.buyExchange,
            sell_exchange: opportunity.sellExchange,
            symbol: opportunity.symbol,
            spread: opportunity.spread,
            potential_profit: opportunity.potential,
            buy_price: opportunity.buyPrice,
            sell_price: opportunity.sellPrice,
            status: 'pending'
          }]).catch(error => {
            console.error('Error storing opportunity:', error);
          });
        }

        // Check Kucoin -> Binance direction
        if (kucoinToBinanceSpread > 0) {
          const opportunity = {
            buyExchange: 'Kucoin',
            sellExchange: 'Binance',
            symbol,
            spread: parseFloat(kucoinToBinanceSpread.toFixed(4)),
            potential: parseFloat((binancePrice - kucoinPrice).toFixed(2)),
            timestamp,
            buyPrice: kucoinPrice,
            sellPrice: binancePrice
          };
          opportunities.push(opportunity);

          // Store in database
          await supabase.from('arbitrage_opportunities').insert([{
            buy_exchange: opportunity.buyExchange,
            sell_exchange: opportunity.sellExchange,
            symbol: opportunity.symbol,
            spread: opportunity.spread,
            potential_profit: opportunity.potential,
            buy_price: opportunity.buyPrice,
            sell_price: opportunity.sellPrice,
            status: 'pending'
          }]).catch(error => {
            console.error('Error storing opportunity:', error);
          });
        }
      } catch (error) {
        console.error(`Error processing ${symbol}:`, error);
        continue;
      }
    }

    // Sort opportunities by potential profit
    opportunities.sort((a, b) => b.potential - a.potential);

    console.log(`Found ${opportunities.length} opportunities`);
    
    return new Response(
      JSON.stringify(opportunities),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in compare-exchange-prices:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
})