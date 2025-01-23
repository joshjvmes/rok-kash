import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const { command } = await req.json()
    
    // Create list of allowed commands for security
    const allowedCommands = [
      'functions list',
      'functions logs',
      'functions deploy --show-region-ips',
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

    return new Response(
      JSON.stringify({
        output: output || error,
        error: error ? true : false
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
})