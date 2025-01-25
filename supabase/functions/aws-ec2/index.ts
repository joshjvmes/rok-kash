import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { EC2Client } from 'https://esm.sh/@aws-sdk/client-ec2@3.370.0';
import { corsHeaders } from './responseUtils.ts';
import { getEC2Client, fetchInstanceStatus, launchEC2Instance, fetchScannerStatus } from './ec2Commands.ts';

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
        const instances = await fetchInstanceStatus(ec2Client);
        return new Response(
          JSON.stringify({ instances }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'launch': {
        const instanceId = await launchEC2Instance(ec2Client, test);
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
        const status = await fetchScannerStatus(ec2Client);
        return new Response(
          JSON.stringify({ status }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'scanner-start': {
        const result = await launchEC2Instance(ec2Client, false, true);
        return new Response(
          JSON.stringify({ 
            message: "Scanner started successfully",
            instanceId: result,
            status: "success"
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'scanner-stop': {
        const { Reservations } = await ec2Client.describeInstances({
          Filters: [{
            Name: 'tag:Purpose',
            Values: ['ArbitrageScanner']
          }]
        });

        const runningInstances = Reservations?.flatMap(r => r.Instances || [])
          .filter(i => i.State?.Name === 'running')
          .map(i => i.InstanceId);

        if (runningInstances?.length) {
          await ec2Client.terminateInstances({
            InstanceIds: runningInstances
          });

          return new Response(
            JSON.stringify({ 
              message: "Scanner stopped successfully",
              status: "success"
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

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
        status: "error",
        stack: error.stack,
        details: 'Check the function logs for more information'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});