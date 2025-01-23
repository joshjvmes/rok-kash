import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    console.log('Starting IP ranges fetch...')
    
    // Ensure we have the required environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Missing required environment variables')
    }

    // Create Supabase client
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseServiceRoleKey
    )

    // Fetch IP ranges from Supabase's API
    console.log('Fetching IP ranges from Supabase API...')
    const response = await fetch('https://api.supabase.com/v1/network/ip-ranges', {
      headers: {
        'Authorization': `Bearer ${supabaseServiceRoleKey}`,
      },
    })

    if (!response.ok) {
      console.error('Failed to fetch IP ranges:', response.status, response.statusText)
      throw new Error(`API responded with status ${response.status}: ${await response.text()}`)
    }

    const data = await response.json()
    console.log('Received IP ranges data:', data)

    // Transform the data into the format we need
    const ipRanges = []
    
    // Process IPv4 ranges
    if (data.ipv4_ranges) {
      for (const range of data.ipv4_ranges) {
        ipRanges.push({
          ip_range: range.cidr,
          region: range.region,
          service: range.service,
        })
      }
    }

    // Process IPv6 ranges
    if (data.ipv6_ranges) {
      for (const range of data.ipv6_ranges) {
        ipRanges.push({
          ip_range: range.cidr,
          region: range.region,
          service: range.service,
        })
      }
    }

    console.log(`Processed ${ipRanges.length} IP ranges`)

    // Update database
    console.log('Clearing existing IP ranges...')
    const { error: deleteError } = await supabaseClient
      .from('supabase_ip_ranges')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (deleteError) {
      console.error('Error deleting existing IP ranges:', deleteError)
      throw deleteError
    }

    if (ipRanges.length > 0) {
      console.log('Inserting new IP ranges...')
      const { error: insertError } = await supabaseClient
        .from('supabase_ip_ranges')
        .insert(ipRanges)

      if (insertError) {
        console.error('Error inserting IP ranges:', insertError)
        throw insertError
      }
    } else {
      console.log('No IP ranges found to insert')
    }

    return new Response(
      JSON.stringify({ message: 'IP ranges updated successfully', count: ipRanges.length }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error updating IP ranges:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})