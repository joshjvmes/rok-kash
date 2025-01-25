import { 
  EC2Client, 
  DescribeInstancesCommand,
  RunInstancesCommand,
  TerminateInstancesCommand,
  CreateSecurityGroupCommand,
  AuthorizeSecurityGroupIngressCommand
} from "https://esm.sh/@aws-sdk/client-ec2@3.370.0";

export const getEC2Client = () => {
  const awsAccessKeyId = Deno.env.get('AWS_ACCESS_KEY_ID');
  const awsSecretAccessKey = Deno.env.get('AWS_SECRET_ACCESS_KEY');

  if (!awsAccessKeyId || !awsSecretAccessKey) {
    throw new Error('AWS credentials not configured');
  }

  return new EC2Client({
    region: "us-east-1",
    credentials: {
      accessKeyId: awsAccessKeyId,
      secretAccessKey: awsSecretAccessKey,
    },
  });
};

export const fetchInstanceStatus = async (ec2Client: EC2Client) => {
  console.log('Fetching EC2 instances status');
  try {
    const command = new DescribeInstancesCommand({});
    const response = await ec2Client.send(command);
    
    return response.Reservations?.flatMap(r => r.Instances || []).map(instance => ({
      instanceId: instance.InstanceId,
      state: instance.State?.Name?.toLowerCase(),
      publicDns: instance.PublicDnsName,
      tags: instance.Tags || []
    })) || [];
  } catch (error) {
    console.error('Error fetching instance status:', error);
    throw error;
  }
};

export const launchEC2Instance = async (ec2Client: EC2Client, isTest = false, isScanner = false) => {
  console.log('Launching new EC2 instance...');
  try {
    const userData = isTest ? 
      btoa('#!/bin/bash\necho "Test instance launched"') :
      btoa('#!/bin/bash\ndocker run -d arbitrage-scanner');

    const command = new RunInstancesCommand({
      ImageId: 'ami-0c7217cdde317cfec', // Amazon Linux 2023 AMI
      InstanceType: isTest ? 't2.micro' : 't2.small',
      MinCount: 1,
      MaxCount: 1,
      UserData: userData,
      TagSpecifications: [{
        ResourceType: 'instance',
        Tags: [{ 
          Key: 'Purpose', 
          Value: isScanner ? 'ArbitrageScanner' : (isTest ? 'Test' : 'Production') 
        }]
      }]
    });

    const response = await ec2Client.send(command);
    const instanceId = response.Instances?.[0]?.InstanceId;
    
    if (!instanceId) {
      throw new Error('Failed to launch instance - no instance ID returned');
    }

    return instanceId;
  } catch (error) {
    console.error('Error launching EC2 instance:', error);
    throw error;
  }
};

export const stopEC2Instance = async (ec2Client: EC2Client, instanceId: string) => {
  console.log(`Stopping EC2 instance ${instanceId}`);
  try {
    const command = new TerminateInstancesCommand({
      InstanceIds: [instanceId]
    });
    
    await ec2Client.send(command);
  } catch (error) {
    console.error(`Error stopping instance ${instanceId}:`, error);
    throw error;
  }
};

export const fetchScannerStatus = async (ec2Client: EC2Client) => {
  try {
    const command = new DescribeInstancesCommand({
      Filters: [{
        Name: 'tag:Purpose',
        Values: ['ArbitrageScanner']
      }]
    });
    
    const response = await ec2Client.send(command);
    const instances = response.Reservations?.flatMap(r => r.Instances || []) || [];
    const runningInstances = instances.filter(i => i.State?.Name === 'running');

    return {
      status: runningInstances.length > 0 ? 'running' : 'stopped',
      lastUpdate: new Date().toISOString(),
      activeInstances: runningInstances.map(i => i.InstanceId),
      activeSymbols: ['BTC/USDT', 'ETH/USDT'], // Default symbols being monitored
      opportunities: 0 // Will be updated by the scanner process
    };
  } catch (error) {
    console.error('Error fetching scanner status:', error);
    throw error;
  }
};