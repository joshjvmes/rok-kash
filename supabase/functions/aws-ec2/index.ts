import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { 
  getEC2Client, 
  fetchInstanceStatus, 
  launchEC2Instance,
  fetchScannerStatus 
} from "./ec2Commands.ts";
import { 
  corsHeaders, 
  createSuccessResponse, 
  createErrorResponse 
} from "./responseUtils.ts";

const TIMEOUT = 25000; // 25 seconds timeout

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ec2Client = getEC2Client();
    const body = await req.json();
    const { action, test, batchSize = 5, timeout = TIMEOUT } = body;
    console.log('Received action:', action, 'with batchSize:', batchSize, 'timeout:', timeout);

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      switch (action) {
        case 'status': {
          const instances = await fetchInstanceStatus(ec2Client);
          return createSuccessResponse({ instances });
        }

        case 'scanner-status': {
          console.log('Fetching scanner status with batching...');
          const instances = await fetchScannerStatus(ec2Client);
          const runningInstances = instances.filter(i => i.State?.Name === 'running');

          // Get recent opportunities from the database
          const { data: opportunities, error: dbError } = await supabase
            .from('arbitrage_opportunities')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);

          if (dbError) throw dbError;

          // Delete opportunities older than 5 minutes
          const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
          const { error: deleteError } = await supabase
            .from('arbitrage_opportunities')
            .delete()
            .lt('created_at', fiveMinutesAgo);

          if (deleteError) {
            console.error('Error deleting old opportunities:', deleteError);
          }

          // Format opportunities for response
          const formattedOpportunities = opportunities?.map(opp => ({
            buyExchange: opp.buy_exchange,
            sellExchange: opp.sell_exchange,
            symbol: opp.symbol,
            spread: opp.spread,
            potential: opp.potential_profit,
            buyPrice: opp.buy_price,
            sellPrice: opp.sell_price
          })) || [];

          console.log(`Found ${formattedOpportunities.length} opportunities`);

          return createSuccessResponse({
            status: {
              status: runningInstances.length > 0 ? 'running' : 'stopped',
              lastUpdate: new Date().toISOString(),
              activeSymbols: runningInstances.map(i => i.InstanceId || ''),
              opportunities: formattedOpportunities.length,
              opportunityDetails: formattedOpportunities
            }
          });
        }

        case 'launch': {
          const instanceId = await launchEC2Instance(ec2Client, test);
          return createSuccessResponse({
            message: "Instance launched successfully",
            instanceId,
            status: "success"
          });
        }

        case 'scanner-start': {
          // Start the scanner and store initial opportunities
          const { data: opportunities, error } = await supabase
            .from('arbitrage_opportunities')
            .insert(body.opportunities || [])
            .select();

          if (error) {
            console.error('Error storing opportunities:', error);
            throw error;
          }

          return createSuccessResponse({
            message: "Scanner started successfully",
            opportunities,
            status: "success"
          });
        }

        case 'scanner-stop': {
          // Clean up opportunities when stopping
          const { error } = await supabase
            .from('arbitrage_opportunities')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');

          if (error) {
            console.error('Error cleaning up opportunities:', error);
            throw error;
          }

          return createSuccessResponse({
            message: "Scanner stopped successfully",
            status: "success"
          });
        }

        default:
          throw new Error(`Unsupported action: ${action}`);
      }
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      return createErrorResponse(new Error('Operation timed out'));
    }
    return createErrorResponse(error);
  }
});