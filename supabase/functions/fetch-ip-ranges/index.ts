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
    // Get service role key from environment
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!serviceRoleKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
    }

    // Fetch IP ranges from Supabase's public endpoint
    console.log('Fetching IP ranges from Supabase API...')
    const response = await fetch('https://api.supabase.com/v1/network/ip-ranges', {
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
      }
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('API Error:', response.status, errorText)
      throw new Error(`API responded with status ${response.status}: ${errorText}`)
    }

    const rawData = await response.json()
    console.log('Raw data from API:', JSON.stringify(rawData, null, 2))
    
    // The API returns an object with arrays for different services
    // We need to flatten and transform this into the format we want
    const ipRanges = [
      ...((rawData.ipv4?.database || []).map((range: string) => ({
        ip_range: range,
        region: null,
        service: 'database'
      })) || []),
      ...((rawData.ipv4?.dashboard || []).map((range: string) => ({
        ip_range: range,
        region: null,
        service: 'dashboard'
      })) || []),
      ...((rawData.ipv4?.api || []).map((range: string) => ({
        ip_range: range,
        region: null,
        service: 'api'
      })) || [])
    ]

    console.log('Number of IP ranges found:', ipRanges.length)
    console.log('Processed IP ranges:', JSON.stringify(ipRanges, null, 2))

    // Create Supabase client using environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    if (!supabaseUrl) {
      throw new Error('SUPABASE_URL is not set')
    }

    const supabaseClient = createClient(
      supabaseUrl,
      serviceRoleKey
    )

    console.log('Clearing existing IP ranges...')
    // Clear existing IP ranges
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
      // Insert new IP ranges
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

    console.log('IP ranges updated successfully')
    return new Response(
      JSON.stringify({ 
        message: 'IP ranges updated successfully',
        count: ipRanges.length 
      }),
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