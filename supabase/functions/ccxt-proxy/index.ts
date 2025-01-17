import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import ccxt from 'npm:ccxt'
import { executeExchangeMethod } from './methods.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TIMEOUT = 30000; // 30 seconds timeout

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
      timeout: TIMEOUT,
      options: {
        defaultType: 'spot',
        adjustForTimeDifference: true,
        recvWindow: TIMEOUT,
      }
    })

    // Configure exchange with API credentials if available
    const apiKey = Deno.env.get(`${exchangeId.toUpperCase()}_API_KEY`)
    const secret = Deno.env.get(`${exchangeId.toUpperCase()}_SECRET`)
    const passphrase = Deno.env.get(`${exchangeId.toUpperCase()}_PASSPHRASE`)

    if (apiKey && secret) {
      exchange.apiKey = apiKey
      exchange.secret = secret
      if (passphrase) {
        exchange.password = passphrase
      }
    }

    // Execute the requested method with a timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Operation timed out')), TIMEOUT);
    });

    const result = await Promise.race([
      executeExchangeMethod(exchange, method, symbol, params),
      timeoutPromise
    ]);

    if (!result) {
      throw new Error(`Failed to execute ${method} on ${exchangeId}`);
    }
    
    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error in ccxt-proxy:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack 
      }), 
      {
        status: error.status || 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})