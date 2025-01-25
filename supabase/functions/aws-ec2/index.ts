import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { 
  EC2Client,
  DescribeInstancesCommand,
  RunInstancesCommand,
  CreateSecurityGroupCommand,
  AuthorizeSecurityGroupIngressCommand,
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
    const { action, test } = body
    console.log('Received action:', action, 'test:', test)

    switch (action) {
      case 'launch': {
        console.log('Starting EC2 instance launch process...')
        
        try {
          // Create a new security group
          const createSecurityGroupParams = {
            Description: 'Security group for arbitrage scanner',
            GroupName: `arbitrage-scanner-sg-${Date.now()}`, // Unique name
            VpcId: 'vpc-0a643842d2043a543', // Your VPC ID
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

          // Basic user data script for testing
          const userDataScript = `#!/bin/bash
echo "Starting setup..." > /var/log/user-data.log
yum update -y
yum install -y nodejs npm
echo "Setup completed" >> /var/log/user-data.log`

          console.log('Creating EC2 instance with user data script...')
          const runInstancesParams = {
            ImageId: 'ami-0e731c8a588258d0d', // Amazon Linux 2023
            InstanceType: test ? 't2.micro' : 't2.small',
            MinCount: 1,
            MaxCount: 1,
            UserData: btoa(userDataScript),
            SecurityGroupIds: [securityGroupId],
            TagSpecifications: [{
              ResourceType: 'instance',
              Tags: [{
                Key: 'Name',
                Value: test ? 'ArbitrageScannerTest' : 'ArbitrageScanner'
              }]
            }]
          }

          console.log('Launching instance with params:', runInstancesParams)
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
          console.error('Error in launch process:', error)
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

      case 'scanner-status': {
        console.log('Fetching scanner status')
        const describeCommand = new DescribeInstancesCommand({
          Filters: [{
            Name: 'tag:Name',
            Values: ['ArbitrageScanner']
          }]
        })
        const response = await ec2Client.send(describeCommand)
        
        const instances = response.Reservations?.flatMap(r => r.Instances || []) || []
        const runningInstances = instances.filter(i => i.State?.Name === 'running')

        // Mock opportunity data for testing
        const mockOpportunities = [{
          buyExchange: 'Binance',
          sellExchange: 'Kraken',
          symbol: 'BTC/USDT',
          spread: 0.5,
          potential: 100.25
        }]

        // Log opportunities for the terminal component
        mockOpportunities.forEach(opp => {
          console.info(`Scanner found opportunity: ${opp.buyExchange} -> ${opp.sellExchange} | ${opp.symbol} | Spread: ${opp.spread}% | Potential: $${opp.potential}`)
        })
        
        return new Response(
          JSON.stringify({
            status: {
              status: runningInstances.length > 0 ? 'running' : 'stopped',
              lastUpdate: new Date().toISOString(),
              activeSymbols: runningInstances.map(i => i.InstanceId || ''),
              opportunities: mockOpportunities.length,
              opportunityDetails: mockOpportunities
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'scanner-start': {
        console.log('Starting scanner...')
        // Get instances with ArbitrageScanner tag
        const describeCommand = new DescribeInstancesCommand({
          Filters: [{
            Name: 'tag:Name',
            Values: ['ArbitrageScanner']
          }]
        })
        const response = await ec2Client.send(describeCommand)
        
        if (!response.Reservations?.length) {
          throw new Error('No scanner instances found')
        }

        // Mock starting the scanner
        console.info('Scanner started successfully')
        
        return new Response(
          JSON.stringify({
            message: "Scanner started successfully",
            status: "success"
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'scanner-stop': {
        console.log('Stopping scanner...')
        const describeCommand = new DescribeInstancesCommand({
          Filters: [{
            Name: 'tag:Name',
            Values: ['ArbitrageScanner']
          }]
        })
        const response = await ec2Client.send(describeCommand)
        
        if (!response.Reservations?.length) {
          throw new Error('No scanner instances found')
        }

        // Mock stopping the scanner
        console.info('Scanner stopped successfully')
        
        return new Response(
          JSON.stringify({
            message: "Scanner stopped successfully",
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