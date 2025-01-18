import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSolBalance, getTokenBalance } from "./balances.ts";
import { getDepositAddress } from "./deposits.ts";
import { handleTransfer } from "./transfers.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, walletAddress, tokenMint, fromType, toType, fromAddress, toAddress, amount, exchange } = await req.json();
    console.log('Processing request:', { action, walletAddress, tokenMint, exchange });

    let result;
    switch (action) {
      case 'getSOLBalance':
        result = await getSolBalance(walletAddress);
        break;

      case 'getTokenBalance':
        result = await getTokenBalance(tokenMint, walletAddress);
        break;

      case 'getDepositAddress':
        result = await getDepositAddress(exchange, tokenMint);
        break;

      case 'transfer':
        result = await handleTransfer({
          fromType,
          toType,
          fromAddress,
          toAddress,
          tokenMint,
          amount
        });
        break;

      default:
        throw new Error(`Unsupported action: ${action}`);
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});