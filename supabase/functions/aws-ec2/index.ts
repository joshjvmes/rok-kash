import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Initializing EC2 client...');
    const ec2Client = getEC2Client();
    
    const body = await req.json();
    const { action, test, batchSize = 5, timeout = TIMEOUT } = body;
    console.log('Received action:', action, 'with batchSize:', batchSize, 'timeout:', timeout);

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
          console.log('Fetching scanner status...');
          const instances = await fetchScannerStatus(ec2Client);
          const runningInstances = instances.filter(i => i.State?.Name === 'running');

          return createSuccessResponse({
            status: {
              status: runningInstances.length > 0 ? 'running' : 'stopped',
              lastUpdate: new Date().toISOString(),
              activeSymbols: ['BTC/USDT', 'ETH/USDT'],
              opportunities: 0,
              opportunityDetails: []
            }
          });
        }

        case 'launch': {
          console.log('Launching new instance...');
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
    console.error('Error in AWS EC2 function:', error);
    if (error.name === 'AbortError') {
      return createErrorResponse(new Error('Operation timed out'));
    }
    return createErrorResponse(error);
  }
});