import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import ccxt from 'npm:ccxt'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60000; // 1 minute in milliseconds
const MAX_REQUESTS = 30; // Maximum requests per window
const requestCounts = new Map<string, { count: number; timestamp: number }>();

function isRateLimited(clientId: string): boolean {
  const now = Date.now();
  const clientRequests = requestCounts.get(clientId);

  if (!clientRequests || (now - clientRequests.timestamp) > RATE_LIMIT_WINDOW) {
    requestCounts.set(clientId, { count: 1, timestamp: now });
    return false;
  }

  if (clientRequests.count >= MAX_REQUESTS) {
    return true;
  }

  clientRequests.count++;
  return false;
}

// Batch process symbols
async function processBatch(
  symbols: string[], 
  exchanges: ccxt.Exchange[], 
  supabase: any
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

        // Compare prices within valid tickers
        for (let i = 0; i < validTickers.length; i++) {
          for (let j = i + 1; j < validTickers.length; j++) {
            const buyExchange = validTickers[i];
            const sellExchange = validTickers[j];

            const spread = ((sellExchange.price - buyExchange.price) / buyExchange.price) * 100;
            const reversedSpread = ((buyExchange.price - sellExchange.price) / sellExchange.price) * 100;

            if (spread > 0) {
              opportunities.push({
                buyExchange: buyExchange.exchange,
                sellExchange: sellExchange.exchange,
                symbol,
                spread: parseFloat(spread.toFixed(4)),
                potential: parseFloat((sellExchange.price - buyExchange.price).toFixed(2)),
                timestamp: new Date().toISOString(),
                buyPrice: buyExchange.price,
                sellPrice: sellExchange.price
              });
            }

            if (reversedSpread > 0) {
              opportunities.push({
                buyExchange: sellExchange.exchange,
                sellExchange: buyExchange.exchange,
                symbol,
                spread: parseFloat(reversedSpread.toFixed(4)),
                potential: parseFloat((buyExchange.price - sellExchange.price).toFixed(2)),
                timestamp: new Date().toISOString(),
                buyPrice: sellExchange.price,
                sellPrice: buyExchange.price
              });
            }
          }
        }
      } catch (error) {
        console.error(`Error processing ${symbol}:`, error);
      }
    });

    await Promise.all(batchPromises);
    // Add small delay between batches to prevent rate limiting
    if (i + batchSize < symbols.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  return opportunities;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientId = req.headers.get('x-client-info') || 'anonymous';
    if (isRateLimited(clientId)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        { 
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { symbols = ['BTC/USDT'] } = await req.json();
    console.log('Starting price comparison for symbols:', symbols);

    // Initialize exchanges with proper configuration
    const exchanges = [
      new ccxt.binance({ enableRateLimit: true, timeout: 30000 }),
      new ccxt.kucoin({ enableRateLimit: true, timeout: 30000 })
    ];

    // Configure API credentials
    const exchangeCredentials = [
      {
        exchange: exchanges[0],
        apiKey: Deno.env.get('BINANCE_API_KEY'),
        secret: Deno.env.get('BINANCE_SECRET')
      },
      {
        exchange: exchanges[1],
        apiKey: Deno.env.get('KUCOIN_API_KEY'),
        secret: Deno.env.get('KUCOIN_SECRET'),
        password: Deno.env.get('KUCOIN_PASSPHRASE')
      }
    ];

    // Apply credentials if available
    exchangeCredentials.forEach(({ exchange, apiKey, secret, password }) => {
      if (apiKey && secret) {
        exchange.apiKey = apiKey;
        exchange.secret = secret;
        if (password && 'password' in exchange) {
          exchange.password = password;
        }
      }
    });

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Load markets in parallel
    await Promise.all(exchanges.map(exchange => 
      exchange.loadMarkets().catch(error => {
        console.error(`Error loading markets for ${exchange.id}:`, error);
      })
    ));

    // Process symbols in batches
    const opportunities = await processBatch(symbols, exchanges, supabase);

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