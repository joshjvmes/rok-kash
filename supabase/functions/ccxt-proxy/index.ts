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
      console.log(`Configuring ${exchangeId} with API credentials`)
      exchange.apiKey = apiKey
      exchange.secret = secret
      if (passphrase) {
        exchange.password = passphrase
      }
    } else {
      console.log(`No API credentials found for ${exchangeId}`)
      if (['fetchBalance', 'createOrder', 'cancelOrder'].includes(method)) {
        console.error(`${exchangeId} requires API credentials for ${method}`)
        console.log('Available environment variables:', Object.keys(Deno.env.toObject()))
        return new Response(
          JSON.stringify({ 
            error: `${exchangeId} requires API credentials for ${method}`,
            details: 'API credentials not configured'
          }),
          {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
    }

    // Execute the requested method with a timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Operation timed out after ${TIMEOUT}ms`)), TIMEOUT);
    });

    try {
      const result = await Promise.race([
        executeExchangeMethod(exchange, method, symbol, params),
        timeoutPromise
      ]);

      if (!result) {
        throw new Error(`Failed to execute ${method} on ${exchangeId}: No result returned`);
      }

      console.log(`Successfully executed ${method} on ${exchangeId}:`, result);
      
      return new Response(
        JSON.stringify(result),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    } catch (methodError) {
      console.error(`Error executing ${method} on ${exchangeId}:`, methodError);
      
      // Check if it's an authentication error
      if (methodError.message.includes('API-key') || methodError.message.includes('Invalid credentials')) {
        return new Response(
          JSON.stringify({
            error: `Authentication failed for ${exchangeId}`,
            details: methodError.message
          }),
          {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      throw methodError; // Re-throw to be caught by outer try-catch
    }
  } catch (error) {
    console.error('Error in ccxt-proxy:', error);
    
    // Determine appropriate status code
    let status = 500;
    if (error.message.includes('timed out')) {
      status = 504; // Gateway Timeout
    } else if (error.message.includes('rate limit')) {
      status = 429; // Too Many Requests
    }

    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack 
      }), 
      {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})