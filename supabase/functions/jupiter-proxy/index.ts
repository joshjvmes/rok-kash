import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Connection, PublicKey } from "npm:@solana/web3.js"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Initialize Solana connection (using devnet for safety)
const connection = new Connection('https://api.devnet.solana.com', 'confirmed')

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { method, inputMint, outputMint, amount, slippage = 1 } = await req.json()
    
    console.log(`Processing Jupiter ${method} request for ${amount} from ${inputMint} to ${outputMint}`)

    let result
    switch (method) {
      case 'getRoutes':
        // Simplified route computation for demo
        // In production, this would use Jupiter SDK to find actual routes
        result = {
          routes: [
            {
              inAmount: amount,
              outAmount: (parseFloat(amount) * 0.98).toString(), // Example with 2% slippage
              priceImpactPct: 0.5,
              marketInfos: [
                {
                  id: "jupiter_route_1",
                  label: "Jupiter",
                  inputMint,
                  outputMint,
                  notEnoughLiquidity: false,
                  minInAmount: (parseFloat(amount) * 0.001).toString(),
                  minOutAmount: (parseFloat(amount) * 0.97).toString(),
                  priceImpactPct: 0.5,
                  slippageBps: slippage * 100,
                }
              ]
            }
          ]
        }
        break

      case 'getQuote':
        // Get quote for best route
        result = {
          inAmount: amount,
          outAmount: (parseFloat(amount) * 0.98).toString(),
          routes: [{
            marketInfos: [
              {
                amountIn: amount,
                amountOut: (parseFloat(amount) * 0.98).toString(),
                fee: (parseFloat(amount) * 0.003).toString(),
                priceImpact: "0.5",
              }
            ],
            slippageBps: slippage * 100,
          }]
        }
        break

      default:
        throw new Error(`Unsupported method: ${method}`)
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in jupiter-proxy:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})