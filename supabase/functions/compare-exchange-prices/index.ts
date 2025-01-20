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
    const exchanges = ['binance', 'kucoin']
    const opportunities = []

    console.log('Starting price comparison for symbols:', symbols)

    // Initialize exchange instances with proper configuration
    const exchangeInstances: { [key: string]: ccxt.Exchange } = {}
    for (const exchange of exchanges) {
      const exchangeClass = ccxt[exchange]
      exchangeInstances[exchange] = new exchangeClass({
        enableRateLimit: true,
        timeout: 30000,
      })

      // Configure exchange-specific settings
      if (exchange === 'binance') {
        exchangeInstances[exchange].apiKey = Deno.env.get('BINANCE_API_KEY')
        exchangeInstances[exchange].secret = Deno.env.get('BINANCE_SECRET')
      } else if (exchange === 'kucoin') {
        exchangeInstances[exchange].apiKey = Deno.env.get('KUCOIN_API_KEY')
        exchangeInstances[exchange].secret = Deno.env.get('KUCOIN_SECRET')
        exchangeInstances[exchange].password = Deno.env.get('KUCOIN_PASSPHRASE')
      }
    }

    // Create Supabase client for storing opportunities
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')
    const supabase = createClient(supabaseUrl!, supabaseKey!)

    // Fetch prices for each symbol across exchanges
    for (const symbol of symbols) {
      console.log(`Fetching prices for ${symbol}`)
      const prices: ExchangePrices = {}

      for (const exchange of exchanges) {
        try {
          await exchangeInstances[exchange].loadMarkets()
          const ticker = await exchangeInstances[exchange].fetchTicker(symbol)
          prices[exchange] = ticker.last
          console.log(`${exchange} price for ${symbol}: ${ticker.last}`)
        } catch (error) {
          console.error(`Error fetching ${symbol} price from ${exchange}:`, error)
          prices[exchange] = null
        }
      }

      // Compare prices between exchanges
      const buyExchange = 'binance'
      const sellExchange = 'kucoin'
      const buyPrice = prices[buyExchange]
      const sellPrice = prices[sellExchange]

      if (buyPrice && sellPrice) {
        // Calculate spread in both directions
        const spread1 = ((sellPrice - buyPrice) / buyPrice) * 100
        const spread2 = ((buyPrice - sellPrice) / sellPrice) * 100

        const timestamp = new Date().toISOString()

        // Check first direction (buy on Binance, sell on Kucoin)
        if (spread1 > 0) {
          const opportunity = {
            buyExchange,
            sellExchange,
            symbol,
            spread: parseFloat(spread1.toFixed(4)),
            potential: parseFloat((sellPrice - buyPrice).toFixed(2)),
            timestamp,
            buyPrice,
            sellPrice
          }
          opportunities.push(opportunity)

          // Store opportunity in database
          try {
            await supabase.from('arbitrage_opportunities').insert([{
              buy_exchange: buyExchange,
              sell_exchange: sellExchange,
              symbol,
              spread: opportunity.spread,
              potential_profit: opportunity.potential,
              buy_price: buyPrice,
              sell_price: sellPrice,
              status: 'pending'
            }])
          } catch (error) {
            console.error('Error storing opportunity:', error)
          }
        }

        // Check reverse direction (buy on Kucoin, sell on Binance)
        if (spread2 > 0) {
          const opportunity = {
            buyExchange: sellExchange,
            sellExchange: buyExchange,
            symbol,
            spread: parseFloat(spread2.toFixed(4)),
            potential: parseFloat((buyPrice - sellPrice).toFixed(2)),
            timestamp,
            buyPrice: sellPrice,
            sellPrice: buyPrice
          }
          opportunities.push(opportunity)

          // Store opportunity in database
          try {
            await supabase.from('arbitrage_opportunities').insert([{
              buy_exchange: sellExchange,
              sell_exchange: buyExchange,
              symbol,
              spread: opportunity.spread,
              potential_profit: opportunity.potential,
              buy_price: sellPrice,
              sell_price: buyPrice,
              status: 'pending'
            }])
          } catch (error) {
            console.error('Error storing opportunity:', error)
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