import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createHmac } from "https://deno.land/std@0.168.0/crypto/mod.ts"

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
    const apiSecret = Deno.env.get('COINBASE_SECRET')

    if (!apiKey || !apiSecret) {
      console.error('Missing Coinbase API credentials')
      throw new Error('Coinbase API credentials are not configured')
    }

    // Parse the API secret which might contain special characters
    let decodedSecret
    try {
      decodedSecret = decodeURIComponent(apiSecret)
      console.log('Successfully decoded API secret')
    } catch (error) {
      console.error('Error decoding API secret:', error)
      throw new Error('Invalid API secret format')
    }
    
    // Get current timestamp for the request
    const timestamp = Math.floor(Date.now() / 1000).toString()
    
    // Create the signature
    const requestPath = `/v2/prices/${base}-USD/spot`
    const message = timestamp + 'GET' + requestPath

    let signature
    try {
      signature = createHmac('sha256', decodedSecret)
        .update(message)
        .toString('hex')
      console.log('Successfully created signature')
    } catch (error) {
      console.error('Error creating signature:', error)
      throw new Error('Failed to create request signature')
    }

    console.log('Making authenticated request to Coinbase API')

    const response = await fetch(`https://api.coinbase.com${requestPath}`, {
      method: 'GET',
      headers: {
        'CB-ACCESS-KEY': apiKey,
        'CB-ACCESS-SIGN': signature,
        'CB-ACCESS-TIMESTAMP': timestamp,
        'CB-VERSION': '2021-06-23',
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Coinbase API error: ${response.status} - ${errorText}`)
      throw new Error(`Coinbase API error: ${response.statusText}`)
    }

    const data = await response.json()
    console.log('Successfully fetched Coinbase price:', data)

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in coinbase-proxy:', error)
    return new Response(
      JSON.stringify({ 
        error: true, 
        message: error.message,
        details: error.stack 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})