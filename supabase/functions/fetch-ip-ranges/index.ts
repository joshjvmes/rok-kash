import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Fetch IP ranges from Supabase's public endpoint
    const response = await fetch('https://api.supabase.com/v1/network/ip-ranges')
    const data = await response.json()

    // Create Supabase client using environment variables
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Clear existing IP ranges
    await supabaseClient
      .from('supabase_ip_ranges')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    // Insert new IP ranges
    const { error } = await supabaseClient.from('supabase_ip_ranges').insert(
      data.map((range: any) => ({
        ip_range: range.cidr,
        region: range.region,
        service: range.service,
      }))
    )

    if (error) throw error

    return new Response(
      JSON.stringify({ message: 'IP ranges updated successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})