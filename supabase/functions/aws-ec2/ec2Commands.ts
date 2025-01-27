import { 
  EC2Client,
  DescribeInstancesCommand,
  RunInstancesCommand,
} from "https://esm.sh/@aws-sdk/client-ec2@3.100.0";

export const getEC2Client = () => {
  try {
    const accessKeyId = Deno.env.get("AWS_ACCESS_KEY_ID");
    const secretAccessKey = Deno.env.get("AWS_SECRET_ACCESS_KEY");
    
    if (!accessKeyId || !secretAccessKey) {
      throw new Error("AWS credentials not found in environment variables");
    }

    console.log('Creating EC2 client with basic credentials');
    
    return new EC2Client({
      region: "us-east-1",
      credentials: {
        accessKeyId,
        secretAccessKey
      }
    });
  } catch (error) {
    console.error("Error creating EC2 client:", error);
    throw error;
  }
};

export const fetchInstanceStatus = async (ec2Client: EC2Client) => {
  try {
    console.log('Fetching EC2 instances status');
    const describeCommand = new DescribeInstancesCommand({
      Filters: [
        {
          Name: 'tag:Name',
          Values: ['ArbitrageScanner', 'TestInstance']
        }
      ]
    });
    
    const response = await ec2Client.send(describeCommand);
    console.log('Describe instances response:', JSON.stringify(response, null, 2));
    
    const instances = response.Reservations?.flatMap(r => r.Instances || []) || [];
    return instances.map(instance => ({
      instanceId: instance.InstanceId,
      state: instance.State?.Name,
      publicDns: instance.PublicDnsName,
      tags: instance.Tags || []
    }));
  } catch (error) {
    console.error('Error fetching instance status:', error);
    throw error;
  }
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
npm install -g pm2@latest

# Create working directory
mkdir -p /opt/arbitrage-scanner
cd /opt/arbitrage-scanner

# Create basic utility scripts
cat > scanner.js << 'EOL'
const ccxt = require('ccxt');

async function main() {
    console.log('Arbitrage scanner initialized');
    // Basic scanner setup - can be enhanced later
    const exchanges = ['binance', 'kraken', 'kucoin'];
    const symbols = ['BTC/USDT', 'ETH/USDT'];
    
    while (true) {
        try {
            console.log('Scanning markets...');
            await new Promise(resolve => setTimeout(resolve, 5000));
        } catch (error) {
            console.error('Scanner error:', error);
        }
    }
}

main().catch(console.error);
EOL

# Install dependencies
npm init -y
npm install ccxt ws express

# Set up PM2 to run on startup
pm2 startup
pm2 start scanner.js --name arbitrage-scanner
pm2 save

# Set environment variables
echo "export NODE_ENV=production" >> /etc/environment
echo "export SCANNER_MODE=advanced" >> /etc/environment`;

  return btoa(script);
};

export const launchEC2Instance = async (ec2Client: EC2Client, isTest = false) => {
  try {
    console.log('Launching new EC2 instance...');
    
    const runResponse = await ec2Client.send(new RunInstancesCommand({
      ImageId: 'ami-0e731c8a588258d0d',
      InstanceType: 't2.medium',
      MinCount: 1,
      MaxCount: 1,
      UserData: getUserDataScript(),
      BlockDeviceMappings: [
        {
          DeviceName: '/dev/xvda',
          Ebs: {
            VolumeSize: 30,
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
      SecurityGroupIds: ['sg-0714db51a0201d3d0'],
    }));
    
    console.log('Launch instance response:', JSON.stringify(runResponse, null, 2));
    
    const instanceId = runResponse.Instances?.[0]?.InstanceId;
    if (!instanceId) {
      throw new Error('No instance ID in launch response');
    }
    
    console.log('Successfully launched instance:', instanceId);
    return instanceId;
  } catch (error) {
    console.error('Error launching EC2 instance:', error);
    throw error;
  }
};

export const fetchScannerStatus = async (ec2Client: EC2Client) => {
  try {
    const describeCommand = new DescribeInstancesCommand({
      Filters: [{
        Name: 'tag:Name',
        Values: ['ArbitrageScanner']
      }]
    });
    
    const response = await ec2Client.send(describeCommand);
    console.log('Scanner status response:', JSON.stringify(response, null, 2));
    return response.Reservations?.flatMap(r => r.Instances || []) || [];
  } catch (error) {
    console.error('Error fetching scanner status:', error);
    throw error;
  }
};
