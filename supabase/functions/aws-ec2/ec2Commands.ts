import { 
  EC2Client, 
  DescribeInstancesCommand,
  RunInstancesCommand,
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
  const command = new DescribeInstancesCommand({});
  const response = await ec2Client.send(command);
  
  return response.Reservations?.flatMap(r => r.Instances || []).map(instance => ({
    instanceId: instance.InstanceId,
    state: instance.State?.Name,
    publicDns: instance.PublicDnsName,
    tags: instance.Tags || []
  })) || [];
};

export const launchEC2Instance = async (ec2Client: EC2Client, isTest = false, isScanner = false) => {
  console.log('Launching new EC2 instance...');
  
  const userData = isTest ? 
    'echo "Test instance launched"' :
    'docker run -d arbitrage-scanner';

  const command = new RunInstancesCommand({
    ImageId: 'ami-0c7217cdde317cfec',
    InstanceType: isTest ? 't2.micro' : 't2.small',
    MinCount: 1,
    MaxCount: 1,
    UserData: btoa(userData),
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
};

export const fetchScannerStatus = async (ec2Client: EC2Client) => {
  const command = new DescribeInstancesCommand({
    Filters: [{
      Name: 'tag:Purpose',
      Values: ['ArbitrageScanner']
    }]
  });
  
  const response = await ec2Client.send(command);
  const runningInstances = response.Reservations?.flatMap(r => r.Instances || [])
    .filter(i => i.State?.Name === 'running')
    .map(i => i.InstanceId) || [];

  return {
    status: runningInstances.length > 0 ? 'running' : 'stopped',
    lastUpdate: new Date().toISOString(),
    activeInstances: runningInstances,
  };
};