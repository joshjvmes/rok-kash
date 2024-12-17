import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ALCHEMY_API_KEY = Deno.env.get('ALCHEMY_API_KEY') || 'demo'
const UNISWAP_QUOTER_CONTRACT = '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6'

const quoterABI = [
  'function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external returns (uint256 amountOut)'
]

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { tokenIn, tokenOut, amount } = await req.json()
    
    console.log(`Fetching Uniswap quote for ${amount} ${tokenIn} to ${tokenOut}`)
    
    // Make direct RPC call to Uniswap Quoter contract
    const response = await fetch(`https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_call',
        params: [{
          to: UNISWAP_QUOTER_CONTRACT,
          data: `0xc6a5026a${tokenIn.slice(2).padStart(64, '0')}${tokenOut.slice(2).padStart(64, '0')}${'1e4'.padStart(64, '0')}${amount.padStart(64, '0')}${'0'.padStart(64, '0')}`
        }, 'latest']
      })
    })

    const result = await response.json()
    
    if (result.error) {
      throw new Error(result.error.message)
    }

    // Parse the result
    const amountOut = parseInt(result.result, 16).toString()
    
    return new Response(JSON.stringify({
      quote: amountOut,
      estimatedGasUsed: "150000", // Approximate gas used for a swap
      route: [{
        protocol: 'v3',
        tokenPath: [tokenIn, tokenOut],
        poolAddresses: [UNISWAP_QUOTER_CONTRACT]
      }]
    }), {
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