import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@aws-sdk/client-ec2@3.370.0';
import { corsHeaders } from './responseUtils.ts';

const AWS_ACCESS_KEY_ID = Deno.env.get('AWS_ACCESS_KEY_ID');
const AWS_SECRET_ACCESS_KEY = Deno.env.get('AWS_SECRET_ACCESS_KEY');

if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
  throw new Error('Missing AWS credentials');
}

const ec2Client = createClient({
  region: 'us-east-1',
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, test = false } = await req.json();
    console.log('Received action:', action);

    switch (action) {
      case 'status': {
        const { Reservations } = await ec2Client.describeInstances({});
        const instances = Reservations?.flatMap(r => r.Instances || []).map(instance => ({
          instanceId: instance.InstanceId,
          state: instance.State?.Name,
          publicDns: instance.PublicDnsName,
          tags: instance.Tags
        })) || [];

        return new Response(JSON.stringify({ instances }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'launch': {
        const userData = test ? 
          'echo "Test instance launched"' :
          'docker run -d arbitrage-scanner';

        const { Instances } = await ec2Client.runInstances({
          ImageId: 'ami-0c7217cdde317cfec', // Amazon Linux 2023
          InstanceType: test ? 't2.micro' : 't2.small',
          MinCount: 1,
          MaxCount: 1,
          UserData: Buffer.from(userData).toString('base64'),
          TagSpecifications: [{
            ResourceType: 'instance',
            Tags: [{ Key: 'Purpose', Value: test ? 'Test' : 'ArbitrageScanner' }]
          }]
        });

        const instanceId = Instances?.[0]?.InstanceId;
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
        // Get instances with ArbitrageScanner tag
        const { Reservations } = await ec2Client.describeInstances({
          Filters: [{
            Name: 'tag:Purpose',
            Values: ['ArbitrageScanner']
          }]
        });

        const runningInstances = Reservations?.flatMap(r => r.Instances || [])
          .filter(i => i.State?.Name === 'running')
          .map(i => i.InstanceId) || [];

        // Get opportunities from database
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data: opportunities, error } = await supabase
          .from('arbitrage_opportunities')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) throw error;

        return new Response(
          JSON.stringify({
            status: {
              status: runningInstances.length > 0 ? 'running' : 'stopped',
              lastUpdate: new Date().toISOString(),
              activeSymbols: runningInstances,
              opportunities: opportunities?.length || 0,
              opportunityDetails: opportunities
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'scanner-start': {
        // Launch a new scanner instance if none is running
        const { Reservations } = await ec2Client.describeInstances({
          Filters: [{
            Name: 'tag:Purpose',
            Values: ['ArbitrageScanner']
          }]
        });

        const runningInstances = Reservations?.flatMap(r => r.Instances || [])
          .filter(i => i.State?.Name === 'running');

        if (!runningInstances?.length) {
          const { Instances } = await ec2Client.runInstances({
            ImageId: 'ami-0c7217cdde317cfec',
            InstanceType: 't2.small',
            MinCount: 1,
            MaxCount: 1,
            UserData: Buffer.from('docker run -d arbitrage-scanner').toString('base64'),
            TagSpecifications: [{
              ResourceType: 'instance',
              Tags: [{ Key: 'Purpose', Value: 'ArbitrageScanner' }]
            }]
          });

          return new Response(
            JSON.stringify({ 
              message: "Scanner started successfully",
              instanceId: Instances?.[0]?.InstanceId,
              status: "success"
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ 
            message: "Scanner is already running",
            status: "success"
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'scanner-stop': {
        // Stop all running scanner instances
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