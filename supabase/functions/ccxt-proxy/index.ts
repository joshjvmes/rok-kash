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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
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
      timeout: 30000,
    })

    configureExchange(exchange, exchangeId)

    const result = await executeExchangeMethod(exchange, method, symbol, params)
    
    console.log(`Successfully processed ${method} request for ${symbol || 'no symbol'} on ${exchangeId}`)
    
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