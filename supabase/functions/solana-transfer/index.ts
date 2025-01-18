import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as ccxt from 'https://esm.sh/ccxt@4.2.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Common Solana token mint addresses to currency code mapping
const TOKEN_MINT_TO_CURRENCY: { [key: string]: string } = {
  'So11111111111111111111111111111111111111112': 'SOL',
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'USDC',
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 'USDT',
}

const EXCHANGE_CONFIGS = {
  binance: {
    apiKey: Deno.env.get('BINANCE_API_KEY'),
    secret: Deno.env.get('BINANCE_SECRET'),
    className: ccxt.binance,
  },
  kraken: {
    apiKey: Deno.env.get('KRAKEN_API_KEY'),
    secret: Deno.env.get('KRAKEN_API_SECRET'),
    className: ccxt.kraken,
  },
  bybit: {
    apiKey: Deno.env.get('BYBIT_API_KEY'),
    secret: Deno.env.get('BYBIT_SECRET'),
    className: ccxt.bybit,
  },
  kucoin: {
    apiKey: Deno.env.get('KUCOIN_API_KEY'),
    secret: Deno.env.get('KUCOIN_SECRET'),
    password: Deno.env.get('KUCOIN_PASSPHRASE'),
    className: ccxt.kucoin,
  },
  okx: {
    apiKey: Deno.env.get('OKX_API_KEY'),
    secret: Deno.env.get('OKX_SECRET'),
    password: Deno.env.get('OKX_PASSPHRASE'),
    className: ccxt.okx,
  },
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, exchange, fromType, toType, fromAddress, toAddress, amount, tokenMint } = await req.json()
    console.log('Received transfer request:', { action, exchange, fromType, toType, fromAddress, toAddress, amount, tokenMint })

    const exchangeConfig = EXCHANGE_CONFIGS[exchange]
    if (!exchangeConfig) {
      throw new Error(`Unsupported exchange: ${exchange}`)
    }

    // Handle withdrawal from exchange to Phantom wallet
    if (fromType === 'exchange' && toType === 'wallet') {
      console.log(`Processing ${exchange} withdrawal to Phantom wallet`)
      
      const currencyCode = TOKEN_MINT_TO_CURRENCY[tokenMint]
      if (!currencyCode) {
        throw new Error(`Unsupported token mint address: ${tokenMint}`)
      }

      console.log(`Initializing ${exchange} client...`)
      const exchangeClient = new exchangeConfig.className(exchangeConfig)

      try {
        console.log(`Initiating withdrawal of ${amount} ${currencyCode} to ${toAddress}...`)
        const withdrawal = await exchangeClient.withdraw(currencyCode, amount, toAddress, {
          network: 'SOL',
        })
        
        console.log('Withdrawal initiated successfully:', withdrawal)
        return new Response(
          JSON.stringify({ 
            status: 'success',
            message: `Successfully initiated withdrawal of ${amount} ${currencyCode} to ${toAddress}`,
            withdrawalId: withdrawal.id,
            txid: withdrawal.txid
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } catch (error) {
        console.error(`Error processing ${exchange} withdrawal:`, error)
        throw new Error(`Failed to process ${exchange} withdrawal: ${error.message}`)
      }
    }

    // Handle deposit address request
    if (action === 'getDepositAddress') {
      console.log(`Fetching ${exchange} deposit address for:`, { tokenMint })
      
      const currencyCode = TOKEN_MINT_TO_CURRENCY[tokenMint]
      if (!currencyCode) {
        throw new Error(`Unsupported token mint address: ${tokenMint}`)
      }

      console.log(`Initializing ${exchange} client...`)
      const exchangeClient = new exchangeConfig.className(exchangeConfig)

      try {
        console.log(`Fetching ${exchange} deposit address for ${currencyCode}...`)
        const depositAddress = await exchangeClient.fetchDepositAddress(currencyCode)
        console.log(`${exchange} deposit address:`, depositAddress)

        return new Response(
          JSON.stringify({ 
            status: 'success',
            address: depositAddress.address,
            tag: depositAddress.tag,
            network: 'SOL'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } catch (error) {
        console.error(`Error fetching ${exchange} deposit address:`, error)
        throw new Error(`Failed to fetch ${exchange} deposit address: ${error.message}`)
      }
    }

    return new Response(
      JSON.stringify({ 
        status: 'error',
        message: 'Invalid action or transfer type specified'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Transfer error:', error)
    return new Response(
      JSON.stringify({ 
        status: 'error',
        error: error.message 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})