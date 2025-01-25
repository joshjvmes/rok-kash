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
      case 'launch': {
        console.log('Starting EC2 instance launch process...')
        
        try {
          // Create a new security group
          const createSecurityGroupParams = {
            Description: 'Security group for arbitrage scanner',
            GroupName: `arbitrage-scanner-sg-${Date.now()}`,
            VpcId: 'vpc-0a643842d2043a543',
          }

          console.log('Creating security group with params:', createSecurityGroupParams)
          const createSgCommand = new CreateSecurityGroupCommand(createSecurityGroupParams)
          const sgResponse = await ec2Client.send(createSgCommand)
          console.log('Security group created:', sgResponse)
          const securityGroupId = sgResponse.GroupId

          if (!securityGroupId) {
            throw new Error('Failed to get security group ID')
          }

          // Add inbound rules to the security group
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

          console.log('Configuring security group rules with params:', authorizeIngressParams)
          const authCommand = new AuthorizeSecurityGroupIngressCommand(authorizeIngressParams)
          await ec2Client.send(authCommand)
          console.log('Security group rules configured successfully')

          // Enhanced user data script with error handling and logging
          const userDataScript = `#!/bin/bash
echo "Starting setup..." > /var/log/user-data.log
yum update -y || { echo "Failed to update system" >> /var/log/user-data.log; exit 1; }
yum install -y nodejs npm git || { echo "Failed to install dependencies" >> /var/log/user-data.log; exit 1; }

# Clone and setup arbitrage scanner
git clone https://github.com/your-repo/arbitrage-scanner.git /opt/arbitrage-scanner || { echo "Failed to clone repository" >> /var/log/user-data.log; exit 1; }
cd /opt/arbitrage-scanner
npm install || { echo "Failed to install npm packages" >> /var/log/user-data.log; exit 1; }

# Start the scanner service
npm start > /var/log/scanner.log 2>&1 &

echo "Setup completed successfully" >> /var/log/user-data.log`

          console.log('Creating EC2 instance with user data script...')
          const runInstancesParams = {
            ImageId: 'ami-0e731c8a588258d0d', // Amazon Linux 2023
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
            // Add monitoring for better visibility
            Monitoring: {
              Enabled: true
            }
          }

          console.log('Launching instance with params:', runInstancesParams)
          const runCommand = new RunInstancesCommand(runInstancesParams)
          const runResponse = await ec2Client.send(runCommand)
          console.log('Launch response:', runResponse)
          
          const instanceId = runResponse.Instances?.[0]?.InstanceId
          if (!instanceId) {
            throw new Error('No instance ID in launch response')
          }

          // Store instance information in Supabase
          await supabase
            .from('arbitrage_settings')
            .upsert([
              {
                user_id: req.headers.get('x-user-id'),
                exchanges: ['Binance', 'Kraken', 'Bybit', 'Kucoin', 'OKX'],
                instance_id: instanceId,
                status: 'launching'
              }
            ])

          return new Response(
            JSON.stringify({
              message: "Successfully launched instance",
              instanceId: instanceId,
              status: "success"
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        } catch (error) {
          console.error('Error in launch process:', error)
          throw error
        }
      }

      case 'status': {
        console.log('Fetching EC2 instances status')
        try {
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

          console.log('Retrieved instances:', instances)

          return new Response(
            JSON.stringify({
              instances,
              status: "success"
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        } catch (error) {
          console.error('Error fetching instance status:', error)
          throw error
        }
      }

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
          const response = await ec2Client.send(describeCommand)
          
          const instances = response.Reservations?.flatMap(r => r.Instances || []) || []
          const runningInstances = instances.filter(i => i.State?.Name === 'running')

          // Fetch recent opportunities from the database
          const { data: opportunities, error } = await supabase
            .from('arbitrage_opportunities')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);

          if (error) {
            console.error('Error fetching opportunities:', error)
            throw error
          }

          const formattedOpportunities = opportunities.map(opp => ({
            buyExchange: opp.buy_exchange,
            sellExchange: opp.sell_exchange,
            symbol: opp.symbol,
            spread: opp.spread,
            potential: opp.potential_profit,
            buyPrice: opp.buy_price,
            sellPrice: opp.sell_price
          }));

          console.log(`Found ${formattedOpportunities.length} opportunities`)
          
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
          console.error('Error fetching scanner status:', error)
          throw error
        }
      }

      default:
        throw new Error(`Unsupported action: ${action}`)
    }
  } catch (error) {
    console.error('Error managing EC2:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        status: "error",
        details: error.stack
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})