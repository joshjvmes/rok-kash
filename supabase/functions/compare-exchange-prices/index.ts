import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import ccxt from 'npm:ccxt'
import { initializeExchanges, findCommonSymbols } from './exchangeUtils.ts'
import { processBatch } from './priceProcessor.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SUPPORTED_EXCHANGES = ['binance', 'kucoin', 'bybit', 'kraken', 'okx'];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { exchanges, additionalPairs } = await req.json();
    console.log('Received request with exchanges:', exchanges);
    console.log('Additional pairs:', additionalPairs);

    const activeExchanges = await initializeExchanges(exchanges);
    console.log('Initialized exchanges:', activeExchanges.map(e => e.id));

    let symbols = await findCommonSymbols(activeExchanges);
    console.log(`Found ${symbols.length} common symbols`);

    // Add valid additional pairs
    if (additionalPairs && Array.isArray(additionalPairs)) {
      const validAdditionalPairs = additionalPairs.filter(pair => 
        activeExchanges.every(exchange => 
          exchange.markets && exchange.markets[pair]
        )
      );
      console.log('Valid additional pairs:', validAdditionalPairs);
      symbols = [...new Set([...symbols, ...validAdditionalPairs])];
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user ID from request if available
    const authHeader = req.headers.get('Authorization');
    let userId: string | undefined;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      if (!userError && user) {
        userId = user.id;
      }
    }

    // Process symbols in batches
    console.log('Processing symbols:', symbols);
    const opportunities = await processBatch(symbols, activeExchanges, supabase, userId);

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
});