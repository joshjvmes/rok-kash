import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import ccxt from 'npm:ccxt'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { method, symbol, params = {} } = await req.json()
    console.log(`Processing ${method} request for ${symbol || 'no symbol'}`)

    const bybit = new ccxt.bybit({
      apiKey: Deno.env.get('BYBIT_API_KEY'),
      secret: Deno.env.get('BYBIT_SECRET'),
      enableRateLimit: true,
    })

    let result
    switch (method) {
      case 'fetchTicker':
        result = await bybit.fetchTicker(symbol)
        break
      case 'fetchOrderBook':
        result = await bybit.fetchOrderBook(symbol, params.limit || 20)
        break
      case 'fetchTrades':
        result = await bybit.fetchTrades(symbol, undefined, params.limit || 50)
        break
      case 'fetchBalance':
        result = await bybit.fetchBalance()
        break
      default:
        throw new Error(`Unsupported method: ${method}`)
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in bybit-proxy:', error)
    return new Response(
      JSON.stringify({
        error: true,
        message: error.message,
        details: error.toString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})