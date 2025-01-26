import { 
  EC2Client, 
  DescribeInstancesCommand,
  RunInstancesCommand,
  CreateSecurityGroupCommand,
  AuthorizeSecurityGroupIngressCommand
} from "npm:@aws-sdk/client-ec2";

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
  const describeCommand = new DescribeInstancesCommand({});
  const response = await ec2Client.send(describeCommand);
  
  const instances = response.Reservations?.flatMap(r => r.Instances || []) || [];
  return instances.map(instance => ({
    instanceId: instance.InstanceId,
    state: instance.State?.Name,
    publicDns: instance.PublicDnsName,
    tags: instance.Tags || []
  }));
};

export const launchEC2Instance = async (ec2Client: EC2Client, isTest = false) => {
  console.log('Launching new EC2 instance...');
  const runResponse = await ec2Client.send(new RunInstancesCommand({
    ImageId: 'ami-0e731c8a588258d0d',
    InstanceType: 't2.small',
    MinCount: 1,
    MaxCount: 1,
    TagSpecifications: [{
      ResourceType: 'instance',
      Tags: [{
        Key: 'Name',
        Value: isTest ? 'TestInstance' : 'ArbitrageScanner'
      }]
    }],
  }));
  
  const instanceId = runResponse.Instances?.[0]?.InstanceId;
  if (!instanceId) {
    throw new Error('No instance ID in launch response');
  }
  
  return instanceId;
};

export const fetchScannerStatus = async (ec2Client: EC2Client) => {
  const describeCommand = new DescribeInstancesCommand({
    Filters: [{
      Name: 'tag:Name',
      Values: ['ArbitrageScanner']
    }]
  });
  
  const response = await ec2Client.send(describeCommand);
  return response.Reservations?.flatMap(r => r.Instances || []) || [];
};