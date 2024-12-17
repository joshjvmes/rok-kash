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
    // Parse and validate request body
    let requestBody
    try {
      const text = await req.text()
      console.log('Raw request body:', text)
      requestBody = JSON.parse(text)
      console.log('Parsed request:', JSON.stringify(requestBody))
    } catch (error) {
      console.error('Error parsing request body:', error)
      return new Response(
        JSON.stringify({
          error: true,
          message: 'Invalid JSON in request body',
          details: error.message
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const { exchange: exchangeId, symbol, method, params = {} } = requestBody
    
    if (!exchangeId || !method) {
      return new Response(
        JSON.stringify({
          error: true,
          message: 'Missing required parameters: exchange and method are required'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    
    console.log(`Processing ${method} request for ${symbol || 'no symbol'} on ${exchangeId}`)
    
    // Initialize the exchange with proper configuration
    const exchangeClass = ccxt[exchangeId]
    if (!exchangeClass) {
      return new Response(
        JSON.stringify({
          error: true,
          message: `Unsupported exchange: ${exchangeId}`
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
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
        exchange.options = {
          ...exchange.options,
          createMarketBuyOrderRequiresPrice: false,
          version: 'v2',
        }
      } else {
        console.warn('No Coinbase API credentials found')
        return new Response(
          JSON.stringify({
            error: true,
            message: 'Coinbase API credentials not configured'
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
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
        return new Response(
          JSON.stringify({
            error: true,
            message: 'Kraken API credentials not configured'
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
    }

    let result
    try {
      switch (method) {
        case 'fetchTicker':
          if (!symbol) {
            throw new Error('Symbol is required for fetchTicker')
          }
          result = await exchange.fetchTicker(symbol)
          break
        case 'fetchOrderBook':
          if (!symbol) {
            throw new Error('Symbol is required for fetchOrderBook')
          }
          result = await exchange.fetchOrderBook(symbol, params.limit || 20)
          break
        case 'fetchOHLCV':
          if (!symbol) {
            throw new Error('Symbol is required for fetchOHLCV')
          }
          result = await exchange.fetchOHLCV(symbol, params.timeframe || '1m')
          break
        case 'fetchTrades':
          if (!symbol) {
            throw new Error('Symbol is required for fetchTrades')
          }
          result = await exchange.fetchTrades(symbol, undefined, params.limit || 50)
          console.log(`Successfully fetched ${result?.length || 0} trades for ${symbol}`)
          break
        case 'fetchMarkets':
          result = await exchange.fetchMarkets()
          break
        case 'fetchBalance':
          result = await exchange.fetchBalance()
          break
        case 'createOrder':
          if (!symbol || !params.side || !params.amount) {
            throw new Error('Missing required order parameters')
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
          if (!params.orderId || !symbol) {
            throw new Error('Order ID and symbol are required for cancelOrder')
          }
          result = await exchange.cancelOrder(params.orderId, symbol)
          break
        case 'fetchOrders':
          if (!symbol) {
            throw new Error('Symbol is required for fetchOrders')
          }
          result = await exchange.fetchOrders(symbol)
          break
        case 'fetchOpenOrders':
          if (!symbol) {
            throw new Error('Symbol is required for fetchOpenOrders')
          }
          result = await exchange.fetchOpenOrders(symbol)
          break
        default:
          throw new Error(`Unsupported method: ${method}`)
      }

      console.log(`Successfully processed ${method} request for ${symbol || 'no symbol'} on ${exchangeId}`)
      
      return new Response(
        JSON.stringify(result),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    } catch (error) {
      console.error(`Error executing ${method}:`, error)
      return new Response(
        JSON.stringify({
          error: true,
          message: `Error executing ${method}`,
          details: error.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
  } catch (error) {
    console.error('Error in ccxt-proxy:', error)
    
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