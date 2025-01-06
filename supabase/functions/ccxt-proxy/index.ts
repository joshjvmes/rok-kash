import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import ccxt from 'npm:ccxt'
import { configureExchange } from './exchanges.ts'
import { executeExchangeMethod } from './methods.ts'

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
      timeout: 60000, // Increased timeout to 60 seconds
      options: {
        defaultType: 'spot',
        recvWindow: 60000, // Added recvWindow for Binance
      }
    })

    try {
      await configureExchange(exchange, exchangeId)
      console.log(`Exchange ${exchangeId} configured successfully`)

      const result = await executeExchangeMethod(exchange, method, symbol, params)
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