import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import ccxt from 'npm:ccxt'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function configureExchange(exchange: ccxt.Exchange, exchangeId: string) {
  switch (exchangeId) {
    case 'coinbase':
      exchange.apiKey = Deno.env.get('COINBASE_API_KEY')
      exchange.secret = Deno.env.get('COINBASE_SECRET')
      break
    case 'kraken':
      exchange.apiKey = Deno.env.get('KRAKEN_API_KEY')
      exchange.secret = Deno.env.get('KRAKEN_API_SECRET')
      break
    case 'bybit':
      exchange.apiKey = Deno.env.get('BYBIT_API_KEY')
      exchange.secret = Deno.env.get('BYBIT_SECRET')
      break
    case 'binance':
      exchange.apiKey = Deno.env.get('BINANCE_API_KEY')
      exchange.secret = Deno.env.get('BINANCE_SECRET')
      break
    case 'kucoin':
      exchange.apiKey = Deno.env.get('KUCOIN_API_KEY')
      exchange.secret = Deno.env.get('KUCOIN_SECRET')
      exchange.password = Deno.env.get('KUCOIN_PASSPHRASE')
      break
    case 'okx':
      exchange.apiKey = Deno.env.get('OKX_API_KEY')
      exchange.secret = Deno.env.get('OKX_SECRET')
      exchange.password = Deno.env.get('OKX_PASSPHRASE')
      break
    default:
      throw new Error(`Unsupported exchange: ${exchangeId}`)
  }

  // Verify credentials are present
  if (!exchange.apiKey || !exchange.secret) {
    throw new Error(`Missing API credentials for ${exchangeId}`)
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const requestBody = await req.json().catch(() => {
      throw new Error('Invalid JSON in request body')
    })

    const { exchange: exchangeId, symbol, method, params = {} } = requestBody
    
    if (!exchangeId || !method) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`Processing ${method} request for ${exchangeId}`, { symbol, params })

    const exchangeClass = ccxt[exchangeId]
    if (!exchangeClass) {
      return new Response(
        JSON.stringify({ error: `Unsupported exchange: ${exchangeId}` }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const exchange = new exchangeClass({
      enableRateLimit: true,
      timeout: 60000,
      options: {
        defaultType: 'spot',
        adjustForTimeDifference: true,
        recvWindow: 60000,
      }
    })

    try {
      // Configure exchange with API credentials
      configureExchange(exchange, exchangeId)
      console.log(`Exchange ${exchangeId} configured with credentials`)

      // Execute the requested method
      // @ts-ignore - dynamic method call
      const result = await exchange[method](symbol, params)
      console.log(`Method ${method} executed successfully for ${exchangeId}`)
      
      return new Response(
        JSON.stringify(result),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    } catch (error) {
      console.error(`Error executing method ${method} on ${exchangeId}:`, error)
      return new Response(
        JSON.stringify({ 
          error: `Error executing ${method} on ${exchangeId}: ${error.message}`,
          details: error.stack 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }
  } catch (error) {
    console.error('Error in ccxt-proxy:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack 
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})