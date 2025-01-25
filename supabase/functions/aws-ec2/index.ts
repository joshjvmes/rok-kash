import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { 
  EC2Client,
  DescribeInstancesCommand,
  RunInstancesCommand,
  CreateSecurityGroupCommand,
  AuthorizeSecurityGroupIngressCommand,
} from "npm:@aws-sdk/client-ec2"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

    const body = await req.json()
    const { action } = body
    console.log('Received action:', action)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    switch (action) {
      case 'scanner-status': {
        console.log('Fetching scanner status')
        try {
          // Get instance status
          const describeCommand = new DescribeInstancesCommand({
            Filters: [{
              Name: 'tag:Name',
              Values: ['ArbitrageScanner']
            }]
          })
          
          console.log('Sending describe instances command...')
          const response = await ec2Client.send(describeCommand)
          console.log('Received response:', JSON.stringify(response, null, 2))
          
          const instances = response.Reservations?.flatMap(r => r.Instances || []) || []
          const runningInstances = instances.filter(i => i.State?.Name === 'running')
          console.log(`Found ${runningInstances.length} running instances`)

          // Fetch recent opportunities from the database
          const { data: opportunities, error: dbError } = await supabase
            .from('arbitrage_opportunities')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);

          if (dbError) {
            console.error('Error fetching opportunities:', dbError)
            throw dbError
          }

          console.log(`Found ${opportunities?.length || 0} opportunities`)
          
          const formattedOpportunities = opportunities?.map(opp => ({
            buyExchange: opp.buy_exchange,
            sellExchange: opp.sell_exchange,
            symbol: opp.symbol,
            spread: opp.spread,
            potential: opp.potential_profit,
            buyPrice: opp.buy_price,
            sellPrice: opp.sell_price
          })) || [];

          return new Response(
            JSON.stringify({
              status: {
                status: runningInstances.length > 0 ? 'running' : 'stopped',
                lastUpdate: new Date().toISOString(),
                activeSymbols: runningInstances.map(i => i.InstanceId || ''),
                opportunities: formattedOpportunities.length,
                opportunityDetails: formattedOpportunities
              }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        } catch (error) {
          console.error('Error in scanner-status:', error)
          throw error
        }
      }

      case 'scanner-start': {
        console.log('Starting scanner...')
        try {
          // Create a new security group
          const createSecurityGroupParams = {
            Description: 'Security group for arbitrage scanner',
            GroupName: `arbitrage-scanner-sg-${Date.now()}`,
            VpcId: 'vpc-0a643842d2043a543',
          }

          console.log('Creating security group...')
          const createSgCommand = new CreateSecurityGroupCommand(createSecurityGroupParams)
          const sgResponse = await ec2Client.send(createSgCommand)
          const securityGroupId = sgResponse.GroupId

          if (!securityGroupId) {
            throw new Error('Failed to get security group ID')
          }

          console.log('Security group created:', securityGroupId)

          // Add inbound rules
          const authorizeIngressParams = {
            GroupId: securityGroupId,
            IpPermissions: [
              {
                IpProtocol: 'tcp',
                FromPort: 22,
                ToPort: 22,
                IpRanges: [{ CidrIp: '0.0.0.0/0' }],
              },
              {
                IpProtocol: 'tcp',
                FromPort: 80,
                ToPort: 80,
                IpRanges: [{ CidrIp: '0.0.0.0/0' }],
              },
            ],
          }

          console.log('Configuring security group rules...')
          const authCommand = new AuthorizeSecurityGroupIngressCommand(authorizeIngressParams)
          await ec2Client.send(authCommand)

          // Enhanced user data script with better error handling and logging
          const userDataScript = `#!/bin/bash
echo "Starting setup..." > /var/log/user-data.log
exec 1> >(tee -a /var/log/user-data.log) 2>&1

# Update system
echo "Updating system packages..."
yum update -y || {
    echo "Failed to update system packages"
    exit 1
}

# Install dependencies
echo "Installing dependencies..."
yum install -y nodejs npm git || {
    echo "Failed to install dependencies"
    exit 1
}

# Clone and setup scanner
echo "Cloning scanner repository..."
git clone https://github.com/your-repo/arbitrage-scanner.git /opt/arbitrage-scanner || {
    echo "Failed to clone repository"
    exit 1
}

cd /opt/arbitrage-scanner || {
    echo "Failed to change directory"
    exit 1
}

echo "Installing npm packages..."
npm install || {
    echo "Failed to install npm packages"
    exit 1
}

# Start scanner service
echo "Starting scanner service..."
npm start > /var/log/scanner.log 2>&1 &

echo "Setup completed successfully"`

          // Launch EC2 instance
          console.log('Launching EC2 instance...')
          const runInstancesParams = {
            ImageId: 'ami-0e731c8a588258d0d',
            InstanceType: 't2.small',
            MinCount: 1,
            MaxCount: 1,
            UserData: btoa(userDataScript),
            SecurityGroupIds: [securityGroupId],
            TagSpecifications: [{
              ResourceType: 'instance',
              Tags: [{
                Key: 'Name',
                Value: 'ArbitrageScanner'
              }]
            }],
            Monitoring: {
              Enabled: true
            }
          }

          const runCommand = new RunInstancesCommand(runInstancesParams)
          const runResponse = await ec2Client.send(runCommand)
          
          const instanceId = runResponse.Instances?.[0]?.InstanceId
          if (!instanceId) {
            throw new Error('No instance ID in launch response')
          }

          console.log('Instance launched successfully:', instanceId)

          return new Response(
            JSON.stringify({
              message: "Scanner started successfully",
              instanceId: instanceId,
              status: "success"
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        } catch (error) {
          console.error('Error starting scanner:', error)
          throw error
        }
      }

      default:
        throw new Error(`Unsupported action: ${action}`)
    }
  } catch (error) {
    console.error('Error in AWS EC2 function:', error)
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
    )
  }
})