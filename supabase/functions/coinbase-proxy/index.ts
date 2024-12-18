import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { symbol, endpoint } = await req.json()
    const [base, quote] = symbol.split('/')
    const productId = `${base}-${quote}`
    
    console.log(`Fetching Coinbase ${endpoint} for ${productId}`)
    
    const apiKey = Deno.env.get('COINBASE_API_KEY')
    const apiSecret = Deno.env.get('COINBASE_SECRET')

    if (!apiKey || !apiSecret) {
      console.error('Missing Coinbase API credentials')
      throw new Error('Coinbase API credentials are not configured')
    }

    const timestamp = Math.floor(Date.now() / 1000).toString()
    let requestPath = ''
    
    switch (endpoint) {
      case 'spot':
        requestPath = `/v2/prices/${productId}/spot`
        break
      case 'orderbook':
        requestPath = `/v2/products/${productId}/book?level=2`
        break
      case 'trades':
        requestPath = `/v2/products/${productId}/trades`
        break
      default:
        throw new Error('Invalid endpoint')
    }

    const message = timestamp + 'GET' + requestPath
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(apiSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    )
    
    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(message)
    )
    
    const signature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    console.log(`Making authenticated request to Coinbase API: ${requestPath}`)

    const response = await fetch(`https://api.coinbase.com${requestPath}`, {
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
    console.log('Successfully fetched Coinbase data:', endpoint)

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