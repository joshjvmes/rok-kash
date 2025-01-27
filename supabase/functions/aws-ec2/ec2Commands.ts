import { AWSSignerV4 } from "https://deno.land/x/aws_sign_v4@1.0.0/mod.ts";

const AWS_REGION = "us-east-1";
const AWS_SERVICE = "ec2";
const AWS_HOST = "ec2.amazonaws.com";

export const getEC2Client = () => {
  const accessKeyId = Deno.env.get("AWS_ACCESS_KEY_ID");
  const secretAccessKey = Deno.env.get("AWS_SECRET_ACCESS_KEY");
  
  if (!accessKeyId || !secretAccessKey) {
    throw new Error("AWS credentials not found in environment variables");
  }

  return new AWSSignerV4(accessKeyId, secretAccessKey, AWS_REGION, AWS_SERVICE);
};

export const fetchInstanceStatus = async (signer: AWSSignerV4) => {
  try {
    console.log('Fetching EC2 instances status');
    
    const params = new URLSearchParams({
      'Action': 'DescribeInstances',
      'Version': '2016-11-15',
      'Filter.1.Name': 'tag:Name',
      'Filter.1.Value.1': 'ArbitrageScanner',
      'Filter.1.Value.2': 'TestInstance'
    });

    const url = `https://${AWS_HOST}/?${params.toString()}`;
    const request = new Request(url, {
      method: 'GET',
    });

    const signedRequest = await signer.sign(request);
    const response = await fetch(signedRequest);
    
    if (!response.ok) {
      throw new Error(`AWS API error: ${response.status} ${response.statusText}`);
    }

    const xmlText = await response.text();
    console.log('Raw AWS response:', xmlText);

    // Basic XML parsing to extract instance information
    const instances = [];
    const matches = xmlText.match(/<instanceId>([^<]+)<\/instanceId>/g) || [];
    
    for (const match of matches) {
      const instanceId = match.replace(/<\/?instanceId>/g, '');
      instances.push({
        instanceId,
        state: xmlText.includes(`<state><name>running</name></state>`) ? 'running' : 'stopped',
        publicDns: (xmlText.match(/<publicDnsName>([^<]+)<\/publicDnsName>/) || [])[1] || '',
        tags: []
      });
    }

    return instances;
  } catch (error) {
    console.error('Error fetching instance status:', error);
    throw error;
  }
};

export const launchEC2Instance = async (signer: AWSSignerV4, isTest = false) => {
  try {
    console.log('Launching new EC2 instance...');
    
    const params = new URLSearchParams({
      'Action': 'RunInstances',
      'Version': '2016-11-15',
      'ImageId': 'ami-0e731c8a588258d0d',
      'InstanceType': 't2.medium',
      'MinCount': '1',
      'MaxCount': '1',
      'TagSpecification.1.ResourceType': 'instance',
      'TagSpecification.1.Tag.1.Key': 'Name',
      'TagSpecification.1.Tag.1.Value': isTest ? 'TestInstance' : 'ArbitrageScanner'
    });

    const url = `https://${AWS_HOST}/?${params.toString()}`;
    const request = new Request(url, {
      method: 'GET',
    });

    const signedRequest = await signer.sign(request);
    const response = await fetch(signedRequest);
    
    if (!response.ok) {
      throw new Error(`AWS API error: ${response.status} ${response.statusText}`);
    }

    const xmlText = await response.text();
    console.log('Launch instance response:', xmlText);
    
    const instanceIdMatch = xmlText.match(/<instanceId>([^<]+)<\/instanceId>/);
    if (!instanceIdMatch) {
      throw new Error('No instance ID in launch response');
    }
    
    return instanceIdMatch[1];
  } catch (error) {
    console.error('Error launching EC2 instance:', error);
    throw error;
  }
};