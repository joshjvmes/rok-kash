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
    
    // Use coinbasepro instead of coinbase
    const actualExchangeId = exchangeId === 'coinbase' ? 'coinbasepro' : exchangeId
    
    const exchangeClass = ccxt[actualExchangeId]
    if (!exchangeClass) {
      return new Response(
        JSON.stringify({
          error: true,
          message: `Unsupported exchange: ${actualExchangeId}`
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
      options: {
        defaultType: 'spot',
        adjustForTimeDifference: true,
        recvWindow: 60000,
      },
      headers: {
        'User-Agent': 'ccxt/1.0'
      }
    })

    // Initialize the markets cache before making any requests
    if (!exchange.markets) {
      console.log('Loading markets for', actualExchangeId)
      try {
        await exchange.loadMarkets()
      } catch (error) {
        console.error(`Error loading markets for ${actualExchangeId}:`, error)
      }
    }

    try {
      await configureExchange(exchange, exchangeId)
    } catch (error) {
      console.error(`Error configuring exchange ${actualExchangeId}:`, error)
      return new Response(
        JSON.stringify({
          error: true,
          message: `Exchange configuration error: ${error.message}`,
          details: error.stack
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    try {
      const result = await executeExchangeMethod(exchange, method, symbol, params)
      console.log(`Successfully processed ${method} request for ${symbol || 'no symbol'} on ${actualExchangeId}`)
      
      return new Response(
        JSON.stringify(result),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    } catch (error) {
      console.error(`Error executing method ${method} on ${actualExchangeId}:`, error)
      return new Response(
        JSON.stringify({
          error: true,
          message: `Method execution error: ${error.message}`,
          details: error.stack
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
        details: error.stack
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})