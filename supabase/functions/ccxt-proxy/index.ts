import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import ccxt from 'npm:ccxt'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { exchange: exchangeId, symbol, method, params = {} } = await req.json()
    
    console.log(`Processing ${method} request for ${symbol} on ${exchangeId}`, params)
    
    // Initialize the exchange
    const exchangeClass = ccxt[exchangeId]
    const exchange = new exchangeClass({
      'enableRateLimit': true,
    })

    let result
    switch (method) {
      case 'fetchTicker':
        result = await exchange.fetchTicker(symbol)
        break
      case 'fetchOrderBook':
        result = await exchange.fetchOrderBook(symbol)
        break
      case 'fetchOHLCV':
        result = await exchange.fetchOHLCV(symbol, params.timeframe || '1m')
        break
      case 'fetchTrades':
        result = await exchange.fetchTrades(symbol)
        break
      case 'fetchMarkets':
        result = await exchange.fetchMarkets()
        break
      case 'fetchBalance':
        result = await exchange.fetchBalance()
        break
      case 'createOrder':
        result = await exchange.createOrder(
          symbol,
          params.type || 'limit',
          params.side,
          params.amount,
          params.price
        )
        break
      case 'cancelOrder':
        result = await exchange.cancelOrder(params.orderId, symbol)
        break
      case 'fetchOrders':
        result = await exchange.fetchOrders(symbol)
        break
      case 'fetchOpenOrders':
        result = await exchange.fetchOpenOrders(symbol)
        break
      default:
        throw new Error(`Unsupported method: ${method}`)
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in ccxt-proxy:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})