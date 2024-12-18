import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json; charset=utf-8'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { symbol } = await req.json()
    const krakenSymbol = symbol.replace('/', '').replace('USD', 'ZUSD')
    
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