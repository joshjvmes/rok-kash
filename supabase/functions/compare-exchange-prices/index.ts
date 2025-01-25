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

const SUPPORTED_EXCHANGES = ['binance', 'kucoin', 'bybit', 'kraken', 'okx'];
const MIN_SPREAD_THRESHOLD = 0.05; // 0.05% minimum spread to consider

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

async function initializeExchanges() {
  const exchanges = SUPPORTED_EXCHANGES.map(id => {
    const exchange = new ccxt[id]({
      enableRateLimit: true,
      timeout: 30000,
      options: {
        defaultType: 'spot',
        adjustForTimeDifference: true,
      }
    });

    // Configure API credentials if available
    const apiKey = Deno.env.get(`${id.toUpperCase()}_API_KEY`);
    const secret = Deno.env.get(`${id.toUpperCase()}_SECRET`);
    const passphrase = Deno.env.get(`${id.toUpperCase()}_PASSPHRASE`);

    if (apiKey && secret) {
      exchange.apiKey = apiKey;
      exchange.secret = secret;
      if (passphrase) {
        exchange.password = passphrase;
      }
    }

    return exchange;
  });

  // Load markets for all exchanges in parallel
  await Promise.all(exchanges.map(exchange => 
    exchange.loadMarkets().catch(error => {
      console.error(`Error loading markets for ${exchange.id}:`, error);
    })
  ));

  return exchanges;
}

async function findCommonSymbols(exchanges: ccxt.Exchange[]) {
  const symbolsByExchange = new Map<string, Set<string>>();

  // Get all symbols for each exchange
  exchanges.forEach(exchange => {
    const symbols = new Set(Object.keys(exchange.markets || {}));
    symbolsByExchange.set(exchange.id, symbols);
  });

  // Find symbols that exist on at least 2 exchanges
  const commonSymbols = new Set<string>();
  const allSymbols = new Set<string>();

  symbolsByExchange.forEach((symbols) => {
    symbols.forEach(symbol => allSymbols.add(symbol));
  });

  allSymbols.forEach(symbol => {
    let count = 0;
    symbolsByExchange.forEach((exchangeSymbols) => {
      if (exchangeSymbols.has(symbol)) count++;
    });
    if (count >= 2) commonSymbols.add(symbol);
  });

  return Array.from(commonSymbols);
}

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

        // Compare prices between exchanges
        for (let i = 0; i < validTickers.length; i++) {
          for (let j = i + 1; j < validTickers.length; j++) {
            const buyExchange = validTickers[i];
            const sellExchange = validTickers[j];

            const spread = ((sellExchange.price - buyExchange.price) / buyExchange.price) * 100;
            const reversedSpread = ((buyExchange.price - sellExchange.price) / sellExchange.price) * 100;

            // Only consider opportunities with spread above threshold
            if (spread > MIN_SPREAD_THRESHOLD) {
              const potential = (sellExchange.price - buyExchange.price) * 100; // Assuming 100 units traded
              opportunities.push({
                buyExchange: buyExchange.exchange,
                sellExchange: sellExchange.exchange,
                symbol,
                spread: parseFloat(spread.toFixed(4)),
                potential: parseFloat(potential.toFixed(2)),
                buyPrice: buyExchange.price,
                sellPrice: sellExchange.price
              });
            }

            if (reversedSpread > MIN_SPREAD_THRESHOLD) {
              const potential = (buyExchange.price - sellExchange.price) * 100;
              opportunities.push({
                buyExchange: sellExchange.exchange,
                sellExchange: buyExchange.exchange,
                symbol,
                spread: parseFloat(reversedSpread.toFixed(4)),
                potential: parseFloat(potential.toFixed(2)),
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

    console.log('Initializing exchanges...');
    const exchanges = await initializeExchanges();
    console.log('Finding common symbols across exchanges...');
    const commonSymbols = await findCommonSymbols(exchanges);
    console.log(`Found ${commonSymbols.length} common symbols`);

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Process symbols in batches
    console.log('Processing symbols in batches...');
    const opportunities = await processBatch(commonSymbols, exchanges, supabase);

    // Sort opportunities by potential profit
    opportunities.sort((a, b) => b.potential - a.potential);

    console.log(`Found ${opportunities.length} opportunities`);
    
    // Store opportunities in Supabase
    if (opportunities.length > 0) {
      const { error } = await supabase
        .from('arbitrage_opportunities')
        .insert(opportunities.map(opp => ({
          ...opp,
          status: 'pending'
        })));

      if (error) {
        console.error('Error storing opportunities:', error);
      }
    }

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