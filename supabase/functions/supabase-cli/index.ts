import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { command } = await req.json()
    console.log('Executing command:', command)
    
    // Create list of allowed commands for security
    const allowedCommands = [
      'functions list',
      'functions deploy --show-region-ips',
      'functions logs'
    ]

    // Validate command
    const isAllowed = allowedCommands.some(allowed => 
      command.startsWith(`supabase ${allowed}`)
    )

    if (!isAllowed) {
      throw new Error('Command not allowed')
    }

    // Execute command using Deno
    const process = new Deno.Command('npx', {
      args: command.split(' '),
      stdout: 'piped',
      stderr: 'piped',
    })

    const { stdout, stderr } = await process.output()
    const output = new TextDecoder().decode(stdout)
    const error = new TextDecoder().decode(stderr)

    console.log('Command output:', output || error)

    return new Response(
      JSON.stringify({
        output: output || error,
        error: error ? true : false
      }),
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