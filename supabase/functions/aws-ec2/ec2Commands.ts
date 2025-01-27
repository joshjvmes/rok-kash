import { 
  EC2Client, 
  DescribeInstancesCommand,
  RunInstancesCommand,
  StartInstancesCommand,
  StopInstancesCommand
} from "https://esm.sh/@aws-sdk/client-ec2@3.525.0";

export const getEC2Client = () => {
  try {
    const accessKeyId = Deno.env.get("AWS_ACCESS_KEY_ID");
    const secretAccessKey = Deno.env.get("AWS_SECRET_ACCESS_KEY");
    
    if (!accessKeyId || !secretAccessKey) {
      throw new Error("AWS credentials not found in environment variables");
    }

    return new EC2Client({
      region: "us-east-1",
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  } catch (error) {
    console.error("Error creating EC2 client:", error);
    throw error;
  }
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

const getUserDataScript = () => {
  const script = `#!/bin/bash
# Update system packages
yum update -y
yum install -y gcc make python3-pip git

# Install Node.js
curl -sL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs

# Install Python packages
pip3 install pandas numpy requests websockets ccxt

# Install PM2 globally
npm install -p pm2@latest -g

# Create working directory
mkdir -p /opt/arbitrage-scanner
cd /opt/arbitrage-scanner

# Clone helper utilities (you can replace this with your actual repository)
git clone https://github.com/your-repo/arbitrage-helpers.git .

# Install dependencies
npm install

# Set up PM2 to run on startup
pm2 startup
pm2 save

# Set environment variables
echo "export NODE_ENV=production" >> /etc/environment
echo "export SCANNER_MODE=advanced" >> /etc/environment

# Start the main service
pm2 start main.js --name arbitrage-scanner`;

  return Buffer.from(script).toString('base64');
};

export const launchEC2Instance = async (ec2Client: EC2Client, isTest = false) => {
  console.log('Launching new EC2 instance with enhanced capabilities...');
  
  const runResponse = await ec2Client.send(new RunInstancesCommand({
    ImageId: 'ami-0e731c8a588258d0d', // Amazon Linux 2 AMI
    InstanceType: 't2.medium', // Upgraded for better performance
    MinCount: 1,
    MaxCount: 1,
    UserData: getUserDataScript(),
    BlockDeviceMappings: [
      {
        DeviceName: '/dev/xvda',
        Ebs: {
          VolumeSize: 30, // Increased storage for utilities
          VolumeType: 'gp3',
          DeleteOnTermination: true
        }
      }
    ],
    TagSpecifications: [{
      ResourceType: 'instance',
      Tags: [{
        Key: 'Name',
        Value: isTest ? 'TestInstance' : 'ArbitrageScanner'
      }]
    }],
    SecurityGroupIds: ['sg-xxxxxxxx'], // Replace with your security group ID
  }));
  
  const instanceId = runResponse.Instances?.[0]?.InstanceId;
  if (!instanceId) {
    throw new Error('No instance ID in launch response');
  }
  
  return instanceId;
};

export const startEC2Instance = async (ec2Client: EC2Client, instanceId: string) => {
  console.log(`Starting EC2 instance: ${instanceId}`);
  await ec2Client.send(new StartInstancesCommand({
    InstanceIds: [instanceId]
  }));
};

export const stopEC2Instance = async (ec2Client: EC2Client, instanceId: string) => {
  console.log(`Stopping EC2 instance: ${instanceId}`);
  await ec2Client.send(new StopInstancesCommand({
    InstanceIds: [instanceId]
  }));
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