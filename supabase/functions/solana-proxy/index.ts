import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Connection, PublicKey } from "npm:@solana/web3.js"
import { getAccount, TOKEN_PROGRAM_ID } from "npm:@solana/spl-token"
import { TokenListProvider } from "npm:@solana/spl-token-registry"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

// Initialize Solana connection (using devnet for safety)
const connection = new Connection('https://api.devnet.solana.com', 'confirmed')

// Initialize Token List Provider
const tokenListProvider = new TokenListProvider()

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    })
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
        try {
          const account = await getAccount(
            connection,
            new PublicKey(walletAddress),
            TOKEN_PROGRAM_ID
          )
          result = {
            mint: tokenMint,
            balance: account.amount.toString(),
            decimals: account.decimals
          }
        } catch (error) {
          console.error('Error getting token balance:', error)
          result = {
            mint: tokenMint,
            balance: '0',
            decimals: 0
          }
        }
        break

      case 'getTokenMetadata':
        const { mint } = params
        const resolvedTokenList = await tokenListProvider.resolve()
        const tokenInfo = resolvedTokenList
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