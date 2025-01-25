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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
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

    const body = await req.json()
    const { action } = body
    console.log('Received action:', action)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    switch (action) {
      case 'status': {
        console.log('Fetching EC2 instances status')
        const describeCommand = new DescribeInstancesCommand({})
        const response = await ec2Client.send(describeCommand)
        
        const instances = response.Reservations?.flatMap(r => r.Instances || []) || []
        const formattedInstances = instances.map(instance => ({
          instanceId: instance.InstanceId,
          state: instance.State?.Name,
          publicDns: instance.PublicDnsName,
          tags: instance.Tags || []
        }))

        return new Response(
          JSON.stringify({ 
            instances: formattedInstances
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'scanner-status': {
        console.log('Fetching scanner status')
        try {
          const describeCommand = new DescribeInstancesCommand({
            Filters: [{
              Name: 'tag:Name',
              Values: ['ArbitrageScanner']
            }]
          })
          
          const response = await ec2Client.send(describeCommand)
          const instances = response.Reservations?.flatMap(r => r.Instances || []) || []
          const runningInstances = instances.filter(i => i.State?.Name === 'running')

          // Fetch recent opportunities with enhanced error handling
          const { data: opportunities, error: dbError } = await supabase
            .from('arbitrage_opportunities')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20)

          if (dbError) {
            throw dbError
          }

          const formattedOpportunities = opportunities?.map(opp => ({
            buyExchange: opp.buy_exchange,
            sellExchange: opp.sell_exchange,
            symbol: opp.symbol,
            spread: opp.spread,
            potential: opp.potential_profit,
            buyPrice: opp.buy_price,
            sellPrice: opp.sell_price
          })) || []

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
        const userDataScript = `#!/bin/bash
echo "Starting setup..." > /var/log/user-data.log
exec 1> >(tee -a /var/log/user-data.log) 2>&1

yum update -y || exit 1
yum install -y nodejs npm git || exit 1

git clone https://github.com/your-repo/arbitrage-scanner.git /opt/arbitrage-scanner || exit 1
cd /opt/arbitrage-scanner || exit 1
npm install || exit 1
npm start > /var/log/scanner.log 2>&1 &

echo "Setup completed successfully"`

        try {
          const sgResponse = await ec2Client.send(new CreateSecurityGroupCommand({
            Description: 'Security group for arbitrage scanner',
            GroupName: `arbitrage-scanner-sg-${Date.now()}`,
            VpcId: 'vpc-0a643842d2043a543',
          }))

          const securityGroupId = sgResponse.GroupId
          if (!securityGroupId) {
            throw new Error('Failed to get security group ID')
          }

          await ec2Client.send(new AuthorizeSecurityGroupIngressCommand({
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
          }))

          const runResponse = await ec2Client.send(new RunInstancesCommand({
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
          }))
          
          const instanceId = runResponse.Instances?.[0]?.InstanceId
          if (!instanceId) {
            throw new Error('No instance ID in launch response')
          }

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

      case 'launch': {
        console.log('Launching new instance...')
        try {
          const runResponse = await ec2Client.send(new RunInstancesCommand({
            ImageId: 'ami-0e731c8a588258d0d',
            InstanceType: 't2.small',
            MinCount: 1,
            MaxCount: 1,
            TagSpecifications: [{
              ResourceType: 'instance',
              Tags: [{
                Key: 'Name',
                Value: 'NewInstance'
              }]
            }],
          }))
          
          const instanceId = runResponse.Instances?.[0]?.InstanceId
          if (!instanceId) {
            throw new Error('No instance ID in launch response')
          }

          return new Response(
            JSON.stringify({
              message: "Instance launched successfully",
              instanceId: instanceId,
              status: "success"
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        } catch (error) {
          console.error('Error launching instance:', error)
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
