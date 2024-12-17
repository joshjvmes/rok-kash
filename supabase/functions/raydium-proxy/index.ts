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
    const { method, poolAddress, tokenInMint, tokenOutMint, amount } = await req.json()
    
    console.log(`Processing Raydium ${method} request for pool: ${poolAddress}`)

    let result
    switch (method) {
      case 'getPoolInfo':
        // Get pool information
        const poolInfo = await connection.getAccountInfo(new PublicKey(poolAddress))
        result = {
          address: poolAddress,
          data: poolInfo ? Buffer.from(poolInfo.data).toString('base64') : null,
          exists: !!poolInfo
        }
        break

      case 'getQuote':
        // Calculate quote for swap (simplified for demo)
        result = {
          amountIn: amount,
          amountOut: (parseFloat(amount) * 0.98).toString(), // Simplified quote with 2% slippage
          fee: (parseFloat(amount) * 0.003).toString(), // 0.3% fee example
          priceImpact: "0.5",
          route: {
            tokenIn: tokenInMint,
            tokenOut: tokenOutMint,
            pools: [poolAddress]
          }
        }
        break

      default:
        throw new Error(`Unsupported method: ${method}`)
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in raydium-proxy:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})