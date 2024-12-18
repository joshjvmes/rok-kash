import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json; charset=utf-8'
}

function formatKrakenPair(symbol: string): string {
  // Remove the '/' and handle special cases for Kraken's pair format
  const [base, quote] = symbol.split('/')
  
  // Kraken prefixes USD with 'Z' and most crypto with 'X'
  // Special cases where 'X' prefix isn't used
  const specialCases = ['DOT', 'ADA', 'SOL', 'AVAX']
  
  let baseAsset = specialCases.includes(base) ? base : `X${base}`
  const quoteAsset = quote === 'USD' ? 'ZUSD' : quote === 'USDC' ? 'USDC' : `X${quote}`
  
  // Remove 'X' prefix for certain assets
  if (base === 'BTC') baseAsset = 'XXBT'
  if (base === 'XRP') baseAsset = 'XXRP'
  if (base === 'ETH') baseAsset = 'XETH'
  
  return baseAsset + quoteAsset
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
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