import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import ccxt from 'npm:ccxt'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { operation, currency, amount, address } = await req.json()

    const exchange = new ccxt.kucoin({
      apiKey: Deno.env.get('KUCOIN_API_KEY'),
      secret: Deno.env.get('KUCOIN_SECRET'),
      password: Deno.env.get('KUCOIN_PASSPHRASE'),
    })

    console.log(`Processing ${operation} for ${amount} ${currency} ${operation === 'withdraw' ? 'to' : 'from'} ${address}`)

    let result
    if (operation === 'withdraw') {
      result = await exchange.withdraw(currency, amount, address, {
        network: 'SOL', // Solana network for Phantom wallet
      })
    } else if (operation === 'deposit') {
      result = await exchange.fetchDepositAddress(currency, {
        network: 'SOL',
      })
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in kucoin-transfer:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})