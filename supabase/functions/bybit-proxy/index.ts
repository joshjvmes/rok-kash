import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import ccxt from 'npm:ccxt'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json; charset=utf-8'
}

function formatBybitPair(symbol: string): string {
  // Special handling for meme tokens and standard pairs
  const symbolMap: Record<string, string> = {
    'MOG/USD': 'MOG/USDT',
    'PEPE/USD': 'PEPE/USDT',
    'BONK/USD': 'BONK/USDT',
    'BTC/USD': 'BTC/USDT',
    'ETH/USD': 'ETH/USDT',
    'SOL/USD': 'SOL/USDT',
    'AVAX/USD': 'AVAX/USDT',
    'ADA/USD': 'ADA/USDT',
    'XRP/USD': 'XRP/USDT'
  };

  // If the symbol is already in USDT format, return it as is
  if (symbol.endsWith('/USDT')) {
    return symbol;
  }

  // Use the mapping or return the original symbol
  return symbolMap[symbol] || symbol;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { method, symbol, params = {} } = await req.json()
    const formattedSymbol = formatBybitPair(symbol)
    console.log(`Processing ${method} request for ${formattedSymbol || 'no symbol'}`)

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
          result = await bybit.fetchTicker(formattedSymbol)
          // Convert USDT price to USD (approximately 1:1)
          if (result && result.last) {
            result = {
              ...result,
              symbol: symbol, // Return the original USD symbol
              last: result.last
            }
          }
        } catch (error) {
          console.error(`Error fetching ticker for ${formattedSymbol}:`, error)
          throw new Error(`Failed to fetch ticker: ${error.message}`)
        }
        break

      case 'fetchOrderBook':
        result = await bybit.fetchOrderBook(formattedSymbol, params.limit || 20)
        break

      case 'fetchTrades':
        result = await bybit.fetchTrades(formattedSymbol, undefined, params.limit || 50)
        break

      case 'fetchBalance':
        result = await bybit.fetchBalance()
        break

      default:
        throw new Error(`Unsupported method: ${method}`)
    }

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