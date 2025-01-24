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

    const { action } = await req.json()
    console.log('Received action:', action)

    switch (action) {
      case 'launch': {
        console.log('Starting EC2 instance launch process...')
        
        const userDataScript = `#!/bin/bash
yum update -y
yum install -y nodejs npm
mkdir -p /opt/arbitrage-api
cd /opt/arbitrage-api
cat > package.json << 'EOL'
{
  "name": "arbitrage-api",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  }
}
EOL

npm install

cat > server.js << 'EOL'
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

let scannerStatus = {
  status: 'stopped',
  lastUpdate: new Date().toISOString(),
  activeSymbols: [],
  opportunities: 0
};

app.get('/status', (req, res) => {
  res.json(scannerStatus);
});

app.get('/start', (req, res) => {
  scannerStatus = {
    status: 'running',
    lastUpdate: new Date().toISOString(),
    activeSymbols: ['BTC/USDT', 'ETH/USDT'],
    opportunities: 0
  };
  res.json({ message: 'Scanner started' });
});

app.get('/stop', (req, res) => {
  scannerStatus = {
    status: 'stopped',
    lastUpdate: new Date().toISOString(),
    activeSymbols: [],
    opportunities: 0
  };
  res.json({ message: 'Scanner stopped' });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(\`API Server running on port \${PORT}\`);
});
EOL

node server.js > /var/log/arbitrage-api.log 2>&1 &
echo "Setup completed" > /var/log/user-data.log`

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
        } catch (error) {
          console.error('Error in RunInstancesCommand:', error)
          throw error
        }
      }

      case 'status': {
        console.log('Fetching EC2 instances status')
        const describeCommand = new DescribeInstancesCommand({})
        const describeResponse = await ec2Client.send(describeCommand)
        
        const allInstances = describeResponse.Reservations?.flatMap(reservation => 
          reservation.Instances?.map(instance => ({
            instanceId: instance.InstanceId,
            state: instance.State?.Name,
            publicDns: instance.PublicDnsName,
            tags: instance.Tags || []
          })) || []
        ) || []

        return new Response(
          JSON.stringify({
            instances: allInstances,
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