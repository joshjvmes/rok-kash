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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ec2Client = getEC2Client();
    const body = await req.json();
    const { action, test } = body;
    console.log('Received action:', action);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    switch (action) {
      case 'status': {
        const instances = await fetchInstanceStatus(ec2Client);
        return createSuccessResponse({ instances });
      }

      case 'scanner-status': {
        const instances = await fetchScannerStatus(ec2Client);
        const runningInstances = instances.filter(i => i.State?.Name === 'running');

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

      default:
        throw new Error(`Unsupported action: ${action}`);
    }
  } catch (error) {
    return createErrorResponse(error);
  }
});