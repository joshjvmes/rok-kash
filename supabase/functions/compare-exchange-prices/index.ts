import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import ccxt from 'npm:ccxt'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ExchangePrices {
  [key: string]: number | null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { symbols = ['BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'SOL/USDT'] } = await req.json()
    const exchanges = ['binance', 'kucoin', 'okx']
    const opportunities = []

    console.log('Starting price comparison for symbols:', symbols)

    // Initialize exchange instances
    const exchangeInstances: { [key: string]: ccxt.Exchange } = {}
    for (const exchange of exchanges) {
      const exchangeClass = ccxt[exchange]
      exchangeInstances[exchange] = new exchangeClass({
        enableRateLimit: true,
        timeout: 30000,
      })
    }

    // Fetch prices for each symbol across all exchanges
    for (const symbol of symbols) {
      console.log(`Fetching prices for ${symbol}`)
      const prices: ExchangePrices = {}

      for (const exchange of exchanges) {
        try {
          const ticker = await exchangeInstances[exchange].fetchTicker(symbol)
          prices[exchange] = ticker.last
          console.log(`${exchange} price for ${symbol}: ${ticker.last}`)
        } catch (error) {
          console.error(`Error fetching ${symbol} price from ${exchange}:`, error)
          prices[exchange] = null
        }
      }

      // Compare prices between exchanges
      for (let i = 0; i < exchanges.length; i++) {
        for (let j = i + 1; j < exchanges.length; j++) {
          const buyExchange = exchanges[i]
          const sellExchange = exchanges[j]
          const buyPrice = prices[buyExchange]
          const sellPrice = prices[sellExchange]

          if (buyPrice && sellPrice) {
            // Calculate spread in both directions
            const spread1 = ((sellPrice - buyPrice) / buyPrice) * 100
            const spread2 = ((buyPrice - sellPrice) / sellPrice) * 100

            // Check first direction (buy on exchange i, sell on exchange j)
            if (spread1 > 0) {
              opportunities.push({
                buyExchange,
                sellExchange,
                symbol,
                spread: parseFloat(spread1.toFixed(4)),
                potential: parseFloat((sellPrice - buyPrice).toFixed(2)),
                buyPrice,
                sellPrice
              })
            }

            // Check reverse direction (buy on exchange j, sell on exchange i)
            if (spread2 > 0) {
              opportunities.push({
                buyExchange: sellExchange,
                sellExchange: buyExchange,
                symbol,
                spread: parseFloat(spread2.toFixed(4)),
                potential: parseFloat((buyPrice - sellPrice).toFixed(2)),
                buyPrice: sellPrice,
                sellPrice: buyPrice
              })
            }
          }
        }
      }
    }

    // Sort opportunities by potential profit
    opportunities.sort((a, b) => b.potential - a.potential)

    console.log(`Found ${opportunities.length} opportunities`)
    
    return new Response(
      JSON.stringify(opportunities),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Error in compare-exchange-prices:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})