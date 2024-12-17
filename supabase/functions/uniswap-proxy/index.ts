import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { ethers } from 'npm:ethers@5.7.2'
import { Token, TradeType, Percent } from 'npm:@uniswap/sdk-core'
import { AlphaRouter } from 'npm:@uniswap/smart-order-router'
import { Protocol } from 'npm:@uniswap/router-sdk'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const CHAIN_ID = 1 // Mainnet

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { tokenIn, tokenOut, amount, slippagePercentage = '0.5' } = await req.json()
    
    console.log(`Fetching Uniswap route for ${amount} ${tokenIn} to ${tokenOut}`)
    
    // Initialize provider
    const provider = new ethers.providers.JsonRpcProvider('https://eth-mainnet.g.alchemy.com/v2/demo')
    
    // Initialize router
    const router = new AlphaRouter({
      chainId: CHAIN_ID,
      provider,
    })

    // Create token instances
    const TOKEN_IN = new Token(CHAIN_ID, tokenIn, 18)
    const TOKEN_OUT = new Token(CHAIN_ID, tokenOut, 18)

    // Convert amount to wei
    const wei = ethers.utils.parseUnits(amount.toString(), 18)

    // Get route
    const route = await router.route(
      wei,
      TOKEN_IN,
      TradeType.EXACT_INPUT,
      {
        recipient: ethers.constants.AddressZero,
        slippageTolerance: new Percent(slippagePercentage, '100'),
        deadline: Math.floor(Date.now() / 1000 + 1800),
        type: TradeType.EXACT_INPUT,
        protocols: [Protocol.V2, Protocol.V3],
      },
      {
        TOKEN_OUT,
      }
    )

    if (!route || !route.quote) {
      throw new Error('No route found')
    }

    const result = {
      quote: ethers.utils.formatUnits(route.quote.toString(), 18),
      estimatedGasUsed: route.estimatedGasUsed.toString(),
      route: route.route.map(r => ({
        protocol: r.protocol,
        tokenPath: r.tokenPath.map(t => t.symbol),
        poolAddresses: r.poolAddresses,
      }))
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in uniswap-proxy:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})