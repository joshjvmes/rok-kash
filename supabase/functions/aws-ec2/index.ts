import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from './responseUtils.ts';
import { 
  getEC2Client, 
  fetchInstanceStatus, 
  launchEC2Instance, 
  stopEC2Instance, 
  fetchScannerStatus 
} from './ec2Commands.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, test = false } = await req.json();
    console.log('Received action:', action);

    const ec2Client = getEC2Client();

    switch (action) {
      case 'status': {
        console.log('Fetching EC2 instances status...');
        const instances = await fetchInstanceStatus(ec2Client);
        console.log('Instances fetched successfully:', instances);
        return new Response(
          JSON.stringify({ instances }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'launch': {
        console.log('Launching new EC2 instance...');
        const instanceId = await launchEC2Instance(ec2Client, test);
        console.log('Instance launched successfully:', instanceId);
        return new Response(
          JSON.stringify({ 
            message: "Instance launched successfully",
            instanceId,
            status: "success"
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'scanner-status': {
        console.log('Fetching scanner status...');
        const status = await fetchScannerStatus(ec2Client);
        console.log('Scanner status fetched:', status);
        return new Response(
          JSON.stringify({ status }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'scanner-start': {
        console.log('Starting scanner...');
        const instanceId = await launchEC2Instance(ec2Client, false, true);
        console.log('Scanner started successfully:', instanceId);
        return new Response(
          JSON.stringify({ 
            message: "Scanner started successfully",
            instanceId,
            status: "success"
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'scanner-stop': {
        console.log('Stopping scanner...');
        const scannerStatus = await fetchScannerStatus(ec2Client);
        
        if (scannerStatus.activeInstances.length > 0) {
          await Promise.all(
            scannerStatus.activeInstances.map(instanceId => 
              stopEC2Instance(ec2Client, instanceId)
            )
          );
          console.log('Scanner stopped successfully');
          return new Response(
            JSON.stringify({ 
              message: "Scanner stopped successfully",
              status: "success"
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('No running scanner instances found');
        return new Response(
          JSON.stringify({ 
            message: "No running scanner instances found",
            status: "success"
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        throw new Error(`Unsupported action: ${action}`);
    }
  } catch (error) {
    console.error('Error in AWS EC2 function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        status: "error"
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});