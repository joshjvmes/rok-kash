import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Simulate CLI command responses
function simulateCommand(command: string): { output: string; error: boolean } {
  const commands = {
    'functions list': {
      output: `
Functions
  • rebalance-transfer
  • supabase-cli
  • aws-connect
  • aws-ec2
  • bybit-proxy
  • calculate-arbitrage
  • ccxt-proxy
  • coinbase-proxy
  • compare-exchange-prices
  • jupiter-proxy
  • kraken-proxy
  • raydium-proxy
  • solana-proxy
  • solana-transfer
  • solana-wallet
  • uniswap-proxy`,
      error: false
    },
    'functions deploy --show-region-ips': {
      output: `
Deployment complete.

Functions can be accessed using the following Region IPs:
  • East US (Virginia) - 100.21.0.0/20
  • West US (Oregon) - 34.214.0.0/16
  • Southeast Asia (Singapore) - 18.136.0.0/16`,
      error: false
    },
    'functions logs': {
      output: `
Recent function logs:
[2024-03-20 10:15:32] INFO: Function "rebalance-transfer" executed successfully
[2024-03-20 10:14:55] INFO: Function "ccxt-proxy" completed with status 200
[2024-03-20 10:13:22] INFO: New deployment detected for "supabase-cli"`,
      error: false
    }
  };

  // Clean up the command string
  const cleanCommand = command.trim().toLowerCase();

  // Find matching command
  const matchingCommand = Object.entries(commands).find(([cmd]) => 
    cleanCommand.startsWith(cmd.toLowerCase())
  );

  if (matchingCommand) {
    return matchingCommand[1];
  }

  return {
    output: `Error: Command "${command}" not recognized. Available commands:\n` +
            `  • functions list\n` +
            `  • functions deploy --show-region-ips\n` +
            `  • functions logs`,
    error: true
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { command } = await req.json()
    console.log('Executing command:', command)
    
    // Validate command exists
    if (!command) {
      throw new Error('No command provided');
    }

    const result = simulateCommand(command);

    return new Response(
      JSON.stringify(result),
      { 
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  } catch (error) {
    console.error('Error executing command:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        output: `Error: ${error.message}`
      }),
      { 
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }
})