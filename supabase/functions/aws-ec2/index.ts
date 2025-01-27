import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getEC2Client, fetchInstanceStatus, launchEC2Instance } from "./ec2Commands.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Initializing EC2 client...');
    const signer = getEC2Client();
    
    const { action, test = false } = await req.json();
    console.log('Received action:', action, 'test:', test);

    switch (action) {
      case 'status': {
        const instances = await fetchInstanceStatus(signer);
        return new Response(
          JSON.stringify({ instances }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'launch': {
        const instanceId = await launchEC2Instance(signer, test);
        return new Response(
          JSON.stringify({
            message: "Instance launched successfully",
            instanceId,
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
        details: error.stack
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});