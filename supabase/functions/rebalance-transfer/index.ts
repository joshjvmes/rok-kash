import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import ccxt from 'npm:ccxt'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { fromExchange, toExchange, token, amount, transactionId } = await req.json()
    console.log(`Processing transfer: ${amount} ${token} from ${fromExchange} to ${toExchange}`)

    // Initialize Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Update transaction status to processing
    const { error: updateError } = await supabaseAdmin
      .from('rebalance_transactions')
      .update({ status: 'processing' })
      .eq('id', transactionId)

    if (updateError) {
      throw new Error(`Failed to update transaction status: ${updateError.message}`)
    }

    // Initialize source exchange with proper configuration
    const sourceExchange = new ccxt[fromExchange]({
      apiKey: Deno.env.get(`${fromExchange.toUpperCase()}_API_KEY`),
      secret: Deno.env.get(`${fromExchange.toUpperCase()}_SECRET`),
      password: fromExchange === 'kucoin' ? Deno.env.get('KUCOIN_PASSPHRASE') : undefined,
      enableRateLimit: true,
    })

    // Initialize destination exchange with proper configuration
    const destExchange = new ccxt[toExchange]({
      apiKey: Deno.env.get(`${toExchange.toUpperCase()}_API_KEY`),
      secret: Deno.env.get(`${toExchange.toUpperCase()}_SECRET`),
      password: toExchange === 'kucoin' ? Deno.env.get('KUCOIN_PASSPHRASE') : undefined,
      enableRateLimit: true,
    })

    try {
      console.log(`Configuring ${fromExchange} with credentials:`, {
        hasApiKey: !!sourceExchange.apiKey,
        hasSecret: !!sourceExchange.secret,
        hasPassphrase: !!sourceExchange.password,
      })

      // Step 1: Withdraw from source exchange
      console.log(`Initiating withdrawal from ${fromExchange}`)
      const withdrawalAddress = await destExchange.fetchDepositAddress(token)
      
      if (!withdrawalAddress?.address) {
        throw new Error(`Could not get deposit address for ${token} on ${toExchange}`)
      }

      console.log('Got deposit address:', withdrawalAddress.address)

      const withdrawal = await sourceExchange.withdraw(
        token,
        amount,
        withdrawalAddress.address,
        withdrawalAddress.tag,
        {
          network: 'TRX' // Default to TRC20 for USDT, customize based on token
        }
      )

      console.log('Withdrawal initiated:', withdrawal)

      // Update transaction with withdrawal hash
      await supabaseAdmin
        .from('rebalance_transactions')
        .update({
          transaction_hash: withdrawal.id,
          status: 'transferring'
        })
        .eq('id', transactionId)

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Transfer initiated successfully',
          withdrawal: withdrawal
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } catch (error) {
      console.error('Transfer error:', error)
      
      // Update transaction with error
      await supabaseAdmin
        .from('rebalance_transactions')
        .update({
          status: 'failed',
          error_message: error.message
        })
        .eq('id', transactionId)

      throw error
    }

  } catch (error) {
    console.error('Error processing transfer:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.stack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})