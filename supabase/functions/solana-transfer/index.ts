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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, exchange, fromType, toType, fromAddress, toAddress, amount, tokenMint } = await req.json()
    console.log('Received transfer request:', { action, exchange, fromType, toType, fromAddress, toAddress, amount, tokenMint });

    // Handle deposit address request
    if (action === 'getDepositAddress') {
      console.log('Fetching deposit address for:', { exchange, tokenMint });
      
      const currencyCode = TOKEN_MINT_TO_CURRENCY[tokenMint];
      if (!currencyCode) {
        throw new Error(`Unsupported token mint address: ${tokenMint}`);
      }

      if (exchange === 'binance') {
        console.log('Initializing Binance client...');
        const binance = new ccxt.binance({
          apiKey: Deno.env.get('BINANCE_API_KEY'),
          secret: Deno.env.get('BINANCE_SECRET'),
        });

        try {
          const depositAddress = await binance.fetchDepositAddress(currencyCode);
          console.log('Binance deposit address:', depositAddress);

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
          console.error('Error fetching Binance deposit address:', error);
          throw new Error(`Failed to fetch Binance deposit address: ${error.message}`);
        }
      }

      throw new Error('Unsupported exchange for deposit address');
    }

    // Handle withdrawal request
    if (action === 'withdraw' && fromType === 'exchange') {
      console.log('Processing withdrawal from exchange:', { exchange, toAddress, amount, tokenMint });
      
      const currencyCode = TOKEN_MINT_TO_CURRENCY[tokenMint];
      if (!currencyCode) {
        throw new Error(`Unsupported token mint address: ${tokenMint}`);
      }

      if (exchange === 'binance') {
        const binance = new ccxt.binance({
          apiKey: Deno.env.get('BINANCE_API_KEY'),
          secret: Deno.env.get('BINANCE_SECRET'),
        });

        try {
          const withdrawal = await binance.withdraw(currencyCode, amount, toAddress, {
            network: 'SOL',
          });
          
          console.log('Withdrawal initiated:', withdrawal);
          return new Response(
            JSON.stringify({ 
              status: 'success',
              withdrawalId: withdrawal.id,
              txid: withdrawal.txid
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        } catch (error) {
          console.error('Error processing withdrawal:', error);
          throw new Error(`Failed to process withdrawal: ${error.message}`);
        }
      }

      throw new Error('Unsupported exchange for withdrawal');
    }

    return new Response(
      JSON.stringify({ 
        status: 'error',
        message: 'Invalid action specified'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Transfer error:', error);
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