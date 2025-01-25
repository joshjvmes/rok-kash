import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { 
  getEC2Client, 
  fetchInstanceStatus, 
  launchEC2Instance,
  fetchScannerStatus,
  stopEC2Instance 
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

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

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

          // Process opportunities in batches
          const { data: opportunities, error: dbError } = await supabase
            .from('arbitrage_opportunities')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);

          if (dbError) throw dbError;

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

        case 'scanner-stop': {
          console.log('Stopping scanner...');
          const instances = await fetchInstanceStatus(ec2Client);
          const runningInstances = instances.filter(i => i.State?.Name === 'running');
          
          for (const instance of runningInstances) {
            if (instance.InstanceId) {
              await stopEC2Instance(ec2Client, instance.InstanceId);
            }
          }
          
          return createSuccessResponse({
            message: "Scanner stopped successfully",
            status: "success"
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