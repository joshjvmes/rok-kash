import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { symbol } = await req.json()
    const [base] = symbol.split('/')
    
    console.log(`Fetching Coinbase price for ${base}-USD`)
    
    const apiKey = Deno.env.get('COINBASE_API_KEY')
    if (!apiKey) {
      throw new Error('COINBASE_API_KEY is not set')
    }

    const response = await fetch(`https://api.coinbase.com/v2/prices/${base}-USD/spot`, {
      headers: {
        'CB-ACCESS-KEY': apiKey,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Coinbase API error: ${response.statusText}`)
    }

    const data = await response.json()
    console.log('Successfully fetched Coinbase price')

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in coinbase-proxy:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})