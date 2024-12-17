import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Connection, PublicKey, Transaction } from "npm:@solana/web3.js"
import { Token, TOKEN_PROGRAM_ID } from "npm:@solana/spl-token"
import { TokenListProvider } from "npm:@solana/spl-token-registry"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Initialize Solana connection (using devnet for safety)
const connection = new Connection('https://api.devnet.solana.com', 'confirmed')

// Initialize Token List Provider
const tokenListProvider = new TokenListProvider()

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { method, params } = await req.json()
    
    console.log(`Processing Solana ${method} request with params:`, params)

    let result
    switch (method) {
      case 'getTokenList':
        const tokenList = await tokenListProvider.resolve()
        const tokenMap = tokenList.filterByClusterSlug('devnet').getList()
        result = tokenMap
        break

      case 'getTokenBalance':
        const { tokenMint, walletAddress } = params
        const token = new Token(
          connection,
          new PublicKey(tokenMint),
          TOKEN_PROGRAM_ID,
          // @ts-ignore: Placeholder for wallet
          null
        )
        const account = await token.getAccountInfo(new PublicKey(walletAddress))
        result = {
          mint: tokenMint,
          balance: account.amount.toString(),
          decimals: account.decimals
        }
        break

      case 'getTokenMetadata':
        const { mint } = params
        const tokenList = await tokenListProvider.resolve()
        const tokenInfo = tokenList
          .filterByClusterSlug('devnet')
          .getList()
          .find(t => t.address === mint)
        
        result = tokenInfo || { error: 'Token not found' }
        break

      default:
        throw new Error(`Unsupported method: ${method}`)
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in solana-proxy:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})