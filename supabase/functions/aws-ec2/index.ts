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
        
        // Create API server setup script
        const apiServerScript = `
# Install Node.js API server dependencies
npm init -y
npm install express cors @supabase/supabase-js dotenv

# Create API server file
cat > server.js << 'EOL'
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Endpoint to get instance status
app.get('/status', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('arbitrage_opportunities')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
      
    if (error) throw error;
    res.json({ status: 'running', data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(\`API Server running on port \${PORT}\`);
});
EOL

# Create environment file
cat > .env << EOL
SUPABASE_URL=${supabaseUrl}
SUPABASE_ANON_KEY=${supabaseAnonKey}
SUPABASE_SERVICE_ROLE_KEY=${supabaseServiceRole}
PORT=3000
EOL

# Start the API server
pm2 start server.js --name "arbitrage-api"
`

        const userDataScript = `#!/bin/bash
yum update -y
yum install -y docker git nodejs npm
service docker start
usermod -a -G docker ec2-user
systemctl enable docker

# Install PM2 for process management
npm install -y pm2 -g

# Setup API server
mkdir -p /opt/arbitrage-api
cd /opt/arbitrage-api
${apiServerScript}

# Setup arbitrage scanner
docker pull node:18
git clone https://github.com/your-org/arbitrage-scanner.git
cd arbitrage-scanner
docker build -t arbitrage-scanner .
docker run -d \\
  --name arbitrage-scanner \\
  --restart unless-stopped \\
  -e BINANCE_API_KEY=${Deno.env.get('BINANCE_API_KEY')} \\
  -e BINANCE_SECRET=${Deno.env.get('BINANCE_SECRET')} \\
  -e BYBIT_API_KEY=${Deno.env.get('BYBIT_API_KEY')} \\
  -e BYBIT_SECRET=${Deno.env.get('BYBIT_SECRET')} \\
  -e KUCOIN_API_KEY=${Deno.env.get('KUCOIN_API_KEY')} \\
  -e KUCOIN_SECRET=${Deno.env.get('KUCOIN_SECRET')} \\
  -e KUCOIN_PASSPHRASE=${Deno.env.get('KUCOIN_PASSPHRASE')} \\
  -e KRAKEN_API_KEY=${Deno.env.get('KRAKEN_API_KEY')} \\
  -e KRAKEN_API_SECRET=${Deno.env.get('KRAKEN_API_SECRET')} \\
  -e OKX_API_KEY=${Deno.env.get('OKX_API_KEY')} \\
  -e OKX_SECRET=${Deno.env.get('OKX_SECRET')} \\
  -e OKX_PASSPHRASE=${Deno.env.get('OKX_PASSPHRASE')} \\
  arbitrage-scanner`

        const encoder = new TextEncoder()
        const userData = btoa(String.fromCharCode(...encoder.encode(userDataScript)))

        const runInstancesParams = {
          ImageId: 'ami-0e731c8a588258d0d', // Amazon Linux 2023
          InstanceType: 't2.medium',
          MinCount: 1,
          MaxCount: 1,
          UserData: userData,
          SecurityGroupIds: ['sg-0123456789abcdef0'], // Replace with your security group ID
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