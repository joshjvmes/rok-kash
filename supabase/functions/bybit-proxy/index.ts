import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import ccxt from 'npm:ccxt'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json; charset=utf-8'
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { method, symbol, params = {} } = await req.json()
    console.log(`Processing ${method} request for ${symbol || 'no symbol'}`)

    // Convert USD to USDT for Bybit as it uses USDT pairs
    const modifiedSymbol = symbol?.replace('/USD', '/USDT')
    console.log(`Modified symbol for Bybit: ${modifiedSymbol}`)

    const bybit = new ccxt.bybit({
      apiKey: Deno.env.get('BYBIT_API_KEY'),
      secret: Deno.env.get('BYBIT_SECRET'),
      enableRateLimit: true,
      options: {
        defaultType: 'spot',
        adjustForTimeDifference: true,
        recvWindow: 60000,
      },
      headers: {
        'User-Agent': 'ccxt/1.0',
        'Accept': 'application/json'
      }
    })

    let result
    switch (method) {
      case 'fetchTicker':
        result = await bybit.fetchTicker(modifiedSymbol)
        break
      case 'fetchOrderBook':
        result = await bybit.fetchOrderBook(modifiedSymbol, params.limit || 20)
        break
      case 'fetchTrades':
        result = await bybit.fetchTrades(modifiedSymbol, undefined, params.limit || 50)
        break
      case 'fetchBalance':
        result = await bybit.fetchBalance()
        break
      default:
        throw new Error(`Unsupported method: ${method}`)
    }

    return new Response(JSON.stringify(result), {
      headers: corsHeaders,
      status: 200
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
        headers: corsHeaders
      }
    )
  }
})