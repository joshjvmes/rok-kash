import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import ccxt from 'npm:ccxt'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json; charset=utf-8'
}

function formatBybitPair(symbol: string): string {
  console.log(`Formatting symbol: ${symbol}`)
  // Remove the slash and convert to uppercase
  const formattedSymbol = symbol.replace('/', '').toUpperCase()
  console.log(`Initial formatting: ${formattedSymbol}`)
  
  // Special handling for USDC pairs - convert to USD
  if (formattedSymbol.endsWith('USDC')) {
    const finalSymbol = formattedSymbol.replace('USDC', 'USD')
    console.log(`Converted USDC pair to: ${finalSymbol}`)
    return finalSymbol
  }
  
  console.log(`Final formatted symbol: ${formattedSymbol}`)
  return formattedSymbol
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { method, symbol, params = {} } = await req.json()
    const formattedSymbol = formatBybitPair(symbol)
    console.log(`Processing ${method} request for ${symbol} (formatted to ${formattedSymbol})`)

    console.log('Initializing Bybit client with API credentials')
    const bybit = new ccxt.bybit({
      apiKey: Deno.env.get('BYBIT_API_KEY'),
      secret: Deno.env.get('BYBIT_SECRET'),
      enableRateLimit: true,
      options: {
        defaultType: 'spot',
        adjustForTimeDifference: true,
        recvWindow: 60000,
      },
      headers: {
        'User-Agent': 'ccxt/1.0',
        'Accept': 'application/json'
      }
    })

    let result
    switch (method) {
      case 'fetchTicker':
        try {
          console.log(`Fetching ticker for ${formattedSymbol}`)
          result = await bybit.fetchTicker(formattedSymbol)
          console.log('Ticker response:', result)
          
          if (result && result.last) {
            result = {
              ...result,
              symbol: symbol, // Return the original symbol format
              last: result.last
            }
            console.log('Formatted ticker result:', result)
          }
        } catch (error) {
          console.error(`Error fetching ticker for ${formattedSymbol}:`, error)
          throw new Error(`Failed to fetch ticker: ${error.message}`)
        }
        break

      case 'fetchOrderBook':
        console.log(`Fetching order book for ${formattedSymbol} with params:`, params)
        result = await bybit.fetchOrderBook(formattedSymbol, params.limit || 20)
        console.log('Order book response:', result)
        break

      case 'fetchTrades':
        console.log(`Fetching trades for ${formattedSymbol} with params:`, params)
        result = await bybit.fetchTrades(formattedSymbol, undefined, params.limit || 50)
        console.log('Trades response:', result)
        break

      case 'fetchBalance':
        console.log('Fetching balance')
        result = await bybit.fetchBalance()
        console.log('Balance response:', result)
        break

      default:
        console.error(`Unsupported method: ${method}`)
        throw new Error(`Unsupported method: ${method}`)
    }

    console.log(`Successfully processed ${method} request`)
    return new Response(JSON.stringify(result), {
      headers: corsHeaders,
      status: 200
    })
  } catch (error) {
    console.error('Error in bybit-proxy:', error)
    
    return new Response(
      JSON.stringify({
        error: true,
        message: error.message,
        details: error.toString()
      }),
      {
        status: 500,
        headers: corsHeaders
      }
    )
  }
})