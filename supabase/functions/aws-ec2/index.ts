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
    const awsAccessKeyId = Deno.env.get('AWS_ACCESS_KEY_ID')
    const awsSecretAccessKey = Deno.env.get('AWS_SECRET_ACCESS_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const supabaseServiceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!awsAccessKeyId || !awsSecretAccessKey) {
      console.error('AWS credentials not configured')
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
    console.log('Received action:', action)

    switch (action) {
      case 'scanner-status':
        const scannerInstances = await getInstances(ec2Client);
        const runningInstance = scannerInstances.find(i => 
          i.state === 'running' && 
          i.tags.some(t => t.Key === 'Name' && t.Value === 'ArbitrageScanner')
        );

        if (!runningInstance || !runningInstance.publicDns) {
          return new Response(
            JSON.stringify({
              status: {
                status: 'stopped',
                lastUpdate: new Date().toISOString(),
                activeSymbols: [],
                opportunities: 0
              }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        try {
          const response = await fetch(`http://${runningInstance.publicDns}:3000/status`);
          const data = await response.json();
          return new Response(
            JSON.stringify({ status: data }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        } catch (error) {
          console.error('Error fetching scanner status:', error);
          return new Response(
            JSON.stringify({
              status: {
                status: 'error',
                lastUpdate: new Date().toISOString(),
                activeSymbols: [],
                opportunities: 0
              }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

      case 'scanner-start':
      case 'scanner-stop':
        const actionType = action === 'scanner-start' ? 'start' : 'stop';
        const targetInstances = await getInstances(ec2Client);
        const targetInstance = targetInstances.find(i => 
          i.tags.some(t => t.Key === 'Name' && t.Value === 'ArbitrageScanner')
        );

        if (!targetInstance || !targetInstance.publicDns) {
          throw new Error('No scanner instance found');
        }

        try {
          const response = await fetch(`http://${targetInstance.publicDns}:3000/${actionType}`);
          const data = await response.json();
          return new Response(
            JSON.stringify(data),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        } catch (error) {
          console.error(`Error ${actionType}ing scanner:`, error);
          throw new Error(`Failed to ${actionType} scanner`);
        }

      case 'launch':
        console.log('Starting EC2 instance launch process...')
        
        const userDataScript = `#!/bin/bash
# Update system
yum update -y
yum install -y curl

# Install Node.js using nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install 18
nvm use 18

# Create working directory
mkdir -p /opt/arbitrage-api
cd /opt/arbitrage-api

# Create package.json
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
    "cors": "^2.8.5",
    "@supabase/supabase-js": "^2.39.3"
  }
}
EOL

# Install dependencies
npm install

# Create API server file
cat > server.js << 'EOL'
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  '${supabaseUrl}',
  '${supabaseServiceRole}'
);

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(\`API Server running on port \${PORT}\`);
});
EOL

# Install PM2 globally
npm install -g pm2

# Start the API server with PM2
pm2 start server.js --name "arbitrage-api"

# Save PM2 process list and setup startup
pm2 save
pm2 startup

# Log completion
echo "Setup completed successfully" > /var/log/user-data.log`

        console.log('Preparing user data script...')
        const encoder = new TextEncoder()
        const userData = btoa(String.fromCharCode(...encoder.encode(userDataScript)))

        console.log('Creating EC2 instance with RunInstancesCommand...')
        const runInstancesParams = {
          ImageId: 'ami-0e731c8a588258d0d',
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

      case 'status':
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

async function getInstances(ec2Client: EC2Client) {
  const describeCommand = new DescribeInstancesCommand({})
  const describeResponse = await ec2Client.send(describeCommand)
  
  return describeResponse.Reservations?.flatMap(reservation => 
    reservation.Instances?.map(instance => ({
      instanceId: instance.InstanceId,
      state: instance.State?.Name,
      publicDns: instance.PublicDnsName,
      tags: instance.Tags || []
    })) || []
  ) || []
}
