import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json; charset=utf-8'
}

function formatKrakenPair(symbol: string): string {
  // Remove the '/' from the pair
  const pair = symbol.replace('/', '');
  
  // Special case for BTC (XBT in Kraken)
  if (pair.startsWith('BTC')) {
    return 'XBT' + pair.slice(3);
  }
  
  // Special cases for meme tokens and other pairs
  const specialPairs: Record<string, string> = {
    'PEPEUSD': 'PEPEUSD',  // Direct mapping for PEPE
    'BONKUSD': 'BONKUSD',  // Direct mapping for BONK
    'MOGUSD': 'MOGUSD',    // Direct mapping for MOG
    'SOLUSD': 'SOLUSDT',   // Kraken uses USDT pair for SOL
    'ADAUSD': 'ADAUSD',    // Direct USD pair for ADA
    'AVAXUSD': 'AVAXUSD'   // Direct USD pair for AVAX
  };

  if (specialPairs[pair]) {
    return specialPairs[pair];
  }
  
  return pair;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol } = await req.json()
    const krakenSymbol = formatKrakenPair(symbol)
    
    console.log(`Fetching Kraken price for symbol: ${krakenSymbol}`)
    
    const response = await fetch(`https://api.kraken.com/0/public/Ticker?pair=${krakenSymbol}`, {
      headers: {
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Kraken API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    if (data.error && data.error.length > 0) {
      throw new Error(`Kraken API error: ${data.error[0]}`)
    }

    return new Response(JSON.stringify(data), {
      headers: corsHeaders,
      status: 200
    })
  } catch (error) {
    console.error('Error in kraken-proxy:', error)
    return new Response(
      JSON.stringify({ 
        error: true, 
        message: error.message 
      }), 
      {
        status: 500,
        headers: corsHeaders
      }
    )
  }
})