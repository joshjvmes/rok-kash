import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Binance } from 'https://esm.sh/ccxt@4.2.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, exchange, fromType, toType, fromAddress, toAddress, amount, tokenMint } = await req.json()

    // Handle deposit address request
    if (action === 'getDepositAddress') {
      console.log('Fetching deposit address for:', { exchange, tokenMint })
      
      if (exchange === 'binance') {
        const binance = new Binance({
          apiKey: Deno.env.get('BINANCE_API_KEY'),
          secret: Deno.env.get('BINANCE_SECRET'),
        })

        try {
          const depositAddress = await binance.fetchDepositAddress(tokenMint)
          console.log('Binance deposit address:', depositAddress)

          return new Response(
            JSON.stringify({ 
              status: 'success',
              address: depositAddress.address,
              tag: depositAddress.tag
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        } catch (error) {
          console.error('Error fetching Binance deposit address:', error)
          throw new Error(`Failed to fetch Binance deposit address: ${error.message}`)
        }
      }

      throw new Error('Unsupported exchange for deposit address')
    }

    // Handle transfer request
    if (!fromType || !toType || !amount || !tokenMint) {
      throw new Error('Missing required transfer parameters')
    }

    // Initialize Binance client when needed
    let binanceClient
    if (fromType === 'exchange' && fromAddress === 'binance' || 
        toType === 'exchange' && toAddress === 'binance') {
      binanceClient = new Binance({
        apiKey: Deno.env.get('BINANCE_API_KEY'),
        secret: Deno.env.get('BINANCE_SECRET'),
      })
    }

    let result
    if (fromType === 'wallet' && toType === 'exchange' && toAddress === 'binance') {
      result = await handleWalletToBinance(
        binanceClient,
        fromAddress,
        amount,
        tokenMint
      )
    } else if (fromType === 'exchange' && fromAddress === 'binance' && toType === 'wallet') {
      result = await handleBinanceToWallet(
        binanceClient,
        toAddress,
        amount,
        tokenMint
      )
    } else {
      throw new Error('Unsupported transfer type or exchange')
    }

    return new Response(
      JSON.stringify(result),
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

async function handleWalletToBinance(
  binance: any,
  fromAddress: string,
  amount: number,
  tokenMint: string
) {
  console.log('Handling wallet to Binance transfer:', {
    fromAddress,
    amount,
    tokenMint
  })

  try {
    // 1. Generate a Binance deposit address for the token
    const depositAddress = await binance.fetchDepositAddress(tokenMint)
    console.log('Generated Binance deposit address:', depositAddress)

    if (!depositAddress || !depositAddress.address) {
      throw new Error('Failed to generate Binance deposit address')
    }

    // 2. Return the deposit address and instructions
    return {
      status: 'pending',
      message: 'Transfer initiated from wallet to Binance',
      depositAddress: depositAddress.address,
      tag: depositAddress.tag,
      instructions: [
        'Send the specified amount to the provided Binance deposit address',
        'Ensure you include the tag/memo if provided',
        'Wait for the transaction to be confirmed on the blockchain',
        'Binance will credit your account once sufficient confirmations are received'
      ]
    }
  } catch (error) {
    console.error('Error in handleWalletToBinance:', error)
    throw new Error(`Failed to process wallet to Binance transfer: ${error.message}`)
  }
}

async function handleBinanceToWallet(
  binance: any,
  toAddress: string,
  amount: number,
  tokenMint: string
) {
  console.log('Handling Binance to wallet transfer:', {
    toAddress,
    amount,
    tokenMint
  })

  try {
    // 1. Verify the withdrawal is possible
    const withdrawalFees = await binance.fetchWithdrawalFees([tokenMint])
    console.log('Withdrawal fees:', withdrawalFees)

    // 2. Initiate the withdrawal
    const withdrawal = await binance.withdraw(tokenMint, amount, toAddress, {
      network: 'SOL', // Specify Solana network
    })
    console.log('Withdrawal initiated:', withdrawal)

    return {
      status: 'pending',
      message: 'Transfer initiated from Binance to wallet',
      withdrawalId: withdrawal.id,
      transactionHash: withdrawal.txid,
      estimatedTime: '10-30 minutes',
      instructions: [
        'Withdrawal has been initiated',
        'You can track the status in your Binance withdrawal history',
        'Funds will appear in your wallet once the transaction is confirmed'
      ]
    }
  } catch (error) {
    console.error('Error in handleBinanceToWallet:', error)
    throw new Error(`Failed to process Binance to wallet transfer: ${error.message}`)
  }
}