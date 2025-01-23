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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Validate AWS credentials
    const awsAccessKeyId = Deno.env.get('AWS_ACCESS_KEY_ID')
    const awsSecretAccessKey = Deno.env.get('AWS_SECRET_ACCESS_KEY')

    if (!awsAccessKeyId || !awsSecretAccessKey) {
      throw new Error('AWS credentials not configured')
    }

    const ec2Client = new EC2Client({
      region: "us-east-1",
      credentials: {
        accessKeyId: awsAccessKeyId,
        secretAccessKey: awsSecretAccessKey,
      },
    })

    const { action } = await req.json()

    switch (action) {
      case 'launch':
        console.log('Starting EC2 instance launch process...')
        
        const userDataScript = `#!/bin/bash
yum update -y
yum install -y docker git
service docker start
usermod -a -G docker ec2-user
systemctl enable docker
docker pull node:18

# Clone and setup arbitrage scanner
git clone https://github.com/your-org/arbitrage-scanner.git
cd arbitrage-scanner
docker build -t arbitrage-scanner .
docker run -d \\
  --name arbitrage-scanner \\
  --restart unless-stopped \\
  -e KUCOIN_API_KEY=${Deno.env.get('KUCOIN_API_KEY')} \\
  -e KUCOIN_SECRET=${Deno.env.get('KUCOIN_SECRET')} \\
  -e KUCOIN_PASSPHRASE=${Deno.env.get('KUCOIN_PASSPHRASE')} \\
  arbitrage-scanner`

        const encoder = new TextEncoder()
        const userData = btoa(String.fromCharCode(...encoder.encode(userDataScript)))

        const runInstancesParams = {
          ImageId: 'ami-0e731c8a588258d0d', // Amazon Linux 2023
          InstanceType: 't2.medium',
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

        console.log('Launching EC2 instance with params:', runInstancesParams)
        const runCommand = new RunInstancesCommand(runInstancesParams)
        const runResponse = await ec2Client.send(runCommand)
        console.log('Launch response:', runResponse)
        
        return new Response(
          JSON.stringify({
            message: "Successfully launched arbitrage scanner instance",
            instanceId: runResponse.Instances?.[0]?.InstanceId,
            status: "success"
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'status':
        console.log('Fetching EC2 instances status')
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