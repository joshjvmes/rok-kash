import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "npm:@solana/web3.js"
import { TOKEN_PROGRAM_ID } from "npm:@solana/spl-token"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SOLANA_RPC_URL = 'https://api.mainnet-beta.solana.com'
const connection = new Connection(SOLANA_RPC_URL, 'confirmed')

// Common token definitions
const TRACKED_TOKENS = [
  {
    symbol: 'USDC',
    address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    decimals: 6
  },
  {
    symbol: 'USDT',
    address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    decimals: 6
  }
]

async function getSolBalance(walletAddress: string): Promise<number> {
  console.log('Fetching SOL balance for:', walletAddress)
  try {
    const publicKey = new PublicKey(walletAddress)
    const balance = await connection.getBalance(publicKey)
    const solBalance = balance / LAMPORTS_PER_SOL
    console.log('SOL balance:', solBalance)
    return solBalance
  } catch (error) {
    console.error('Error getting SOL balance:', error)
    throw error
  }
}

async function getTokenBalance(tokenMint: string, walletAddress: string) {
  console.log(`Fetching balance for token ${tokenMint} and wallet ${walletAddress}`)
  try {
    const walletPubkey = new PublicKey(walletAddress)
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      walletPubkey,
      {
        programId: TOKEN_PROGRAM_ID,
      }
    )

    const tokenAccount = tokenAccounts.value.find(
      (account) => account.account.data.parsed.info.mint === tokenMint
    )

    if (tokenAccount) {
      const parsedInfo = tokenAccount.account.data.parsed.info
      return {
        mint: tokenMint,
        balance: parsedInfo.tokenAmount.amount,
        decimals: parsedInfo.tokenAmount.decimals
      }
    }

    return {
      mint: tokenMint,
      balance: '0',
      decimals: 6
    }
  } catch (error) {
    console.error('Error fetching token balance:', error)
    throw error
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { action, walletAddress, tokenMint } = await req.json()
    console.log('Processing request:', { action, walletAddress, tokenMint })

    let result
    switch (action) {
      case 'getSOLBalance':
        result = await getSolBalance(walletAddress)
        break

      case 'getTokenBalance':
        result = await getTokenBalance(tokenMint, walletAddress)
        break

      case 'getAllBalances':
        const solBalance = await getSolBalance(walletAddress)
        const tokenBalances = await Promise.all(
          TRACKED_TOKENS.map(async (token) => {
            const balance = await getTokenBalance(token.address, walletAddress)
            return {
              symbol: token.symbol,
              ...balance
            }
          })
        )
        result = {
          sol: solBalance,
          tokens: tokenBalances
        }
        break

      default:
        throw new Error(`Unsupported action: ${action}`)
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error processing request:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})