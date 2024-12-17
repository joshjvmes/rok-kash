import { createClient } from '@supabase/supabase-js';
import { serve } from 'https://deno.fresh.dev/std@v9.6.1/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol } = await req.json();
    
    // Format symbol for Coinbase API (e.g., "BTC/USD" -> "BTC-USD")
    const formattedSymbol = symbol.replace('/', '-');
    
    // Make request to Coinbase API
    const response = await fetch(`https://api.coinbase.com/v2/prices/${formattedSymbol}/spot`, {
      headers: {
        'CB-ACCESS-KEY': Deno.env.get('COINBASE_API_KEY') || '',
        'CB-ACCESS-SECRET': Deno.env.get('COINBASE_SECRET') || '',
      },
    });

    if (!response.ok) {
      throw new Error(`Coinbase API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});