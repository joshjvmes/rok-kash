import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { 
  EC2Client,
  DescribeInstancesCommand,
  RunInstancesCommand,
} from "npm:@aws-sdk/client-ec2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const awsAccessKeyId = Deno.env.get('AWS_ACCESS_KEY_ID')
    const awsSecretAccessKey = Deno.env.get('AWS_SECRET_ACCESS_KEY')

    if (!awsAccessKeyId || !awsSecretAccessKey) {
      throw new Error('AWS credentials not configured')
    }

    console.log('Initializing EC2 client...')
    const ec2Client = new EC2Client({
      region: "us-east-1",
      credentials: {
        accessKeyId: awsAccessKeyId,
        secretAccessKey: awsSecretAccessKey,
      },
    })

    // Parse request body
    let body;
    try {
      body = await req.json()
    } catch (error) {
      console.error('Error parsing request body:', error)
      throw new Error('Invalid request body')
    }

    const { action } = body
    console.log('Received action:', action)

    switch (action) {
      case 'launch': {
        console.log('Starting EC2 instance launch process...')
        
        // Simplified user data script for testing
        const userDataScript = `#!/bin/bash
echo "Starting setup..." > /var/log/user-data.log
yum update -y
yum install -y nodejs npm
echo "Node.js installed" >> /var/log/user-data.log
echo "Setup completed" >> /var/log/user-data.log`

        console.log('Preparing user data script...')
        const encoder = new TextEncoder()
        const userData = btoa(String.fromCharCode(...encoder.encode(userDataScript)))

        console.log('Creating EC2 instance...')
        const runInstancesParams = {
          ImageId: 'ami-0e731c8a588258d0d', // Amazon Linux 2023
          InstanceType: 't2.micro',
          MinCount: 1,
          MaxCount: 1,
          UserData: userData,
          SecurityGroupIds: ['sg-0d534a988b5751839'],
          TagSpecifications: [{
            ResourceType: 'instance',
            Tags: [{
              Key: 'Name',
              Value: 'ArbitrageScanner'
            }]
          }]
        }

        try {
          console.log('Sending RunInstancesCommand...')
          const runCommand = new RunInstancesCommand(runInstancesParams)
          const runResponse = await ec2Client.send(runCommand)
          console.log('Launch response:', runResponse)
          
          return new Response(
            JSON.stringify({
              message: "Successfully launched instance",
              instanceId: runResponse.Instances?.[0]?.InstanceId,
              status: "success"
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        } catch (error) {
          console.error('Error in RunInstancesCommand:', error)
          throw error
        }
      }

      case 'status': {
        console.log('Fetching EC2 instances status')
        const describeCommand = new DescribeInstancesCommand({})
        const describeResponse = await ec2Client.send(describeCommand)
        
        const instances = describeResponse.Reservations?.flatMap(reservation => 
          reservation.Instances?.map(instance => ({
            instanceId: instance.InstanceId,
            state: instance.State?.Name,
            publicDns: instance.PublicDnsName,
            tags: instance.Tags || []
          })) || []
        ) || []

        return new Response(
          JSON.stringify({
            instances,
            status: "success"
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

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