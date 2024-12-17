import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import ccxt from 'npm:ccxt'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { exchange: exchangeId, symbol, method, params = {} } = await req.json()
    
    console.log(`Processing ${method} request for ${symbol} on ${exchangeId}`, params)
    
    // Initialize the exchange with proper configuration
    const exchangeClass = ccxt[exchangeId]
    if (!exchangeClass) {
      throw new Error(`Unsupported exchange: ${exchangeId}`)
    }

    const exchange = new exchangeClass({
      enableRateLimit: true,
      timeout: 30000, // Increase timeout to 30 seconds
    })

    // Add API keys based on the exchange
    if (exchangeId === 'coinbase') {
      const apiKey = Deno.env.get('COINBASE_API_KEY')
      const apiSecret = Deno.env.get('COINBASE_SECRET')
      
      if (apiKey && apiSecret) {
        console.log('Configuring Coinbase with API credentials')
        exchange.apiKey = apiKey
        exchange.secret = apiSecret
        // Additional Coinbase-specific settings
        exchange.options = {
          ...exchange.options,
          createMarketBuyOrderRequiresPrice: false,
          version: 'v2',  // Use v2 API
        }
      } else {
        console.warn('No Coinbase API credentials found')
      }
    } else if (exchangeId === 'kraken') {
      const apiKey = Deno.env.get('KRAKEN_API_KEY')
      const apiSecret = Deno.env.get('KRAKEN_API_SECRET')
      
      if (apiKey && apiSecret) {
        console.log('Configuring Kraken with API credentials')
        exchange.apiKey = apiKey
        exchange.secret = apiSecret
      } else {
        console.warn('No Kraken API credentials found')
      }
    }

    let result
    switch (method) {
      case 'fetchTicker':
        result = await exchange.fetchTicker(symbol)
        break
      case 'fetchOrderBook':
        result = await exchange.fetchOrderBook(symbol, params.limit || 20)
        break
      case 'fetchOHLCV':
        result = await exchange.fetchOHLCV(symbol, params.timeframe || '1m')
        break
      case 'fetchTrades':
        try {
          result = await exchange.fetchTrades(symbol, undefined, params.limit || 50)
          console.log(`Successfully fetched ${result?.length || 0} trades for ${symbol}`)
        } catch (error) {
          console.error(`Error fetching trades: ${error.message}`)
          result = []
        }
        break
      case 'fetchMarkets':
        result = await exchange.fetchMarkets()
        break
      case 'fetchBalance':
        if (!exchange.apiKey || !exchange.secret) {
          throw new Error(`API credentials not configured for ${exchangeId}`)
        }
        result = await exchange.fetchBalance()
        break
      case 'createOrder':
        if (!exchange.apiKey || !exchange.secret) {
          throw new Error(`API credentials not configured for ${exchangeId}`)
        }
        result = await exchange.createOrder(
          symbol,
          params.type || 'limit',
          params.side,
          params.amount,
          params.price
        )
        break
      case 'cancelOrder':
        if (!exchange.apiKey || !exchange.secret) {
          throw new Error(`API credentials not configured for ${exchangeId}`)
        }
        result = await exchange.cancelOrder(params.orderId, symbol)
        break
      case 'fetchOrders':
        if (!exchange.apiKey || !exchange.secret) {
          throw new Error(`API credentials not configured for ${exchangeId}`)
        }
        result = await exchange.fetchOrders(symbol)
        break
      case 'fetchOpenOrders':
        if (!exchange.apiKey || !exchange.secret) {
          throw new Error(`API credentials not configured for ${exchangeId}`)
        }
        result = await exchange.fetchOpenOrders(symbol)
        break
      default:
        throw new Error(`Unsupported method: ${method}`)
    }

    console.log(`Successfully processed ${method} request for ${symbol} on ${exchangeId}`)
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in ccxt-proxy:', error)
    
    // Return a structured error response
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