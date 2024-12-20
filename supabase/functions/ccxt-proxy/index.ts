import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import * as ccxt from 'npm:ccxt'
import { configureExchange } from './exchanges.ts'
import { executeExchangeMethod } from './methods.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    })
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({
        error: true,
        message: 'Method not allowed'
      }),
      {
        status: 405,
        headers: corsHeaders
      }
    )
  }

  try {
    const { exchange: exchangeId, symbol, method, params = {} } = await req.json()

    if (!exchangeId || !method) {
      return new Response(
        JSON.stringify({
          error: true,
          message: 'Missing required parameters'
        }),
        {
          status: 400,
          headers: corsHeaders
        }
      )
    }

    console.log(`Processing ${method} request for ${symbol || 'no symbol'} on ${exchangeId}`)
    
    // Use coinbasepro for coinbase
    const actualExchangeId = exchangeId === 'coinbase' ? 'coinbasepro' : exchangeId
    console.log(`Using exchange ID: ${actualExchangeId}`)
    
    const exchangeClass = ccxt[actualExchangeId]
    if (!exchangeClass) {
      return new Response(
        JSON.stringify({
          error: true,
          message: `Unsupported exchange: ${actualExchangeId}`
        }),
        {
          status: 400,
          headers: corsHeaders
        }
      )
    }

    const exchange = new exchangeClass({
      enableRateLimit: true,
      timeout: 30000,
      options: {
        defaultType: 'spot',
        adjustForTimeDifference: true,
      }
    })

    // Initialize the markets cache before making any requests
    if (!exchange.markets) {
      console.log('Loading markets for', actualExchangeId)
      try {
        await exchange.loadMarkets()
      } catch (error) {
        console.error(`Error loading markets for ${actualExchangeId}:`, error)
        throw error
      }
    }

    try {
      await configureExchange(exchange, exchangeId)
    } catch (error) {
      console.error(`Error configuring exchange ${actualExchangeId}:`, error)
      return new Response(
        JSON.stringify({
          error: true,
          message: `Failed to configure exchange: ${error.message}`
        }),
        {
          status: 500,
          headers: corsHeaders
        }
      )
    }

    try {
      const result = await executeExchangeMethod(exchange, method, symbol, params)
      console.log(`Successfully processed ${method} request for ${symbol || 'no symbol'} on ${actualExchangeId}`)
      
      return new Response(
        JSON.stringify(result),
        {
          headers: corsHeaders
        }
      )
    } catch (error) {
      console.error(`Error executing method ${method} on ${actualExchangeId}:`, error)
      return new Response(
        JSON.stringify({
          error: true,
          message: `Method execution error: ${error.message}`,
          details: error.toString()
        }),
        {
          status: 500,
          headers: corsHeaders
        }
      )
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({
        error: true,
        message: 'Internal server error',
        details: error.toString()
      }),
      {
        status: 500,
        headers: corsHeaders
      }
    )
  }
})