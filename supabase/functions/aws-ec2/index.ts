import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { 
  EC2Client,
  DescribeInstancesCommand,
  RunInstancesCommand,
  CreateTagsCommand
} from "npm:@aws-sdk/client-ec2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const ec2Client = new EC2Client({
      region: "us-east-1",
      credentials: {
        accessKeyId: Deno.env.get('AWS_ACCESS_KEY_ID') || '',
        secretAccessKey: Deno.env.get('AWS_SECRET_ACCESS_KEY') || '',
      },
    })

    // Parse the request body
    const { action, instanceParams } = await req.json()

    switch (action) {
      case 'launch':
        // Launch a new EC2 instance with Docker pre-installed
        const userDataScript = `#!/bin/bash
yum update -y
yum install -y docker
service docker start
usermod -a -G docker ec2-user
docker pull node:18`;

        // Use TextEncoder instead of Buffer
        const encoder = new TextEncoder();
        const userData = btoa(String.fromCharCode(...encoder.encode(userDataScript)));

        const runInstancesParams = {
          ImageId: 'ami-0e731c8a588258d0d', // Latest Amazon Linux 2023 AMI
          InstanceType: 't2.micro',
          MinCount: 1,
          MaxCount: 1,
          UserData: userData,
          TagSpecifications: [{
            ResourceType: 'instance',
            Tags: [{
              Key: 'Name',
              Value: 'ArbitrageScanner'
            }]
          }]
        }

        console.log('Launching EC2 instance with params:', runInstancesParams);
        const runCommand = new RunInstancesCommand(runInstancesParams)
        const runResponse = await ec2Client.send(runCommand)
        console.log('Launch response:', runResponse);
        
        return new Response(
          JSON.stringify({
            message: "Successfully launched EC2 instance",
            instanceId: runResponse.Instances?.[0]?.InstanceId,
            status: "success"
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'status':
        console.log('Fetching EC2 instances status');
        const describeCommand = new DescribeInstancesCommand({})
        const describeResponse = await ec2Client.send(describeCommand)
        
        const instances = describeResponse.Reservations?.flatMap(reservation => 
          reservation.Instances?.map(instance => ({
            instanceId: instance.InstanceId,
            state: instance.State?.Name,
            publicDns: instance.PublicDnsName,
            tags: instance.Tags
          })) || []
        ) || []

        return new Response(
          JSON.stringify({
            instances,
            status: "success"
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      default:
        throw new Error(`Unsupported action: ${action}`)
    }
  } catch (error) {
    console.error('Error managing EC2:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        status: "error" 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})