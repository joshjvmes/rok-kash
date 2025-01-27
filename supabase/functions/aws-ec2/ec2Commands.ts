import { sign } from "https://deno.land/x/aws4fetch@1.0.0/mod.ts";

const AWS_REGION = "us-east-1";
const AWS_SERVICE = "ec2";

export const getEC2Client = () => {
  const accessKeyId = Deno.env.get("AWS_ACCESS_KEY_ID");
  const secretAccessKey = Deno.env.get("AWS_SECRET_ACCESS_KEY");
  
  if (!accessKeyId || !secretAccessKey) {
    throw new Error("AWS credentials not found in environment variables");
  }

  return {
    accessKeyId,
    secretAccessKey
  };
};

export const fetchInstanceStatus = async (credentials: { accessKeyId: string; secretAccessKey: string }) => {
  try {
    console.log('Fetching EC2 instances status');
    
    const url = `https://ec2.${AWS_REGION}.amazonaws.com/?Action=DescribeInstances&Version=2016-11-15`;
    const request = await sign(url, {
      aws: credentials,
      service: AWS_SERVICE,
      region: AWS_REGION,
    });

    const response = await fetch(request);
    const text = await response.text();
    console.log('Raw EC2 response:', text);

    if (!response.ok) {
      throw new Error(`EC2 API error: ${response.status} ${text}`);
    }

    // Parse XML response
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, "text/xml");
    
    const instances = Array.from(xmlDoc.getElementsByTagName("instancesSet")).map(instanceSet => {
      const instance = instanceSet.getElementsByTagName("item")[0];
      if (!instance) return null;

      const instanceId = instance.getElementsByTagName("instanceId")[0]?.textContent;
      const state = instance.getElementsByTagName("name")[0]?.textContent;
      const publicDns = instance.getElementsByTagName("publicDnsName")[0]?.textContent;

      return {
        instanceId,
        state: state?.toLowerCase(),
        publicDns,
        tags: []
      };
    }).filter(Boolean);

    return instances;
  } catch (error) {
    console.error('Error fetching instance status:', error);
    throw error;
  }
};

export const launchEC2Instance = async (credentials: { accessKeyId: string; secretAccessKey: string }, isTest = false) => {
  try {
    console.log('Launching new EC2 instance...');
    
    const params = new URLSearchParams({
      'Action': 'RunInstances',
      'Version': '2016-11-15',
      'ImageId': 'ami-0e731c8a588258d0d',
      'InstanceType': 't2.medium',
      'MinCount': '1',
      'MaxCount': '1',
      'SecurityGroupId.1': 'sg-0714db51a0201d3d0',
    });

    const url = `https://ec2.${AWS_REGION}.amazonaws.com/?${params.toString()}`;
    const request = await sign(url, {
      aws: credentials,
      service: AWS_SERVICE,
      region: AWS_REGION,
    });

    const response = await fetch(request);
    const text = await response.text();
    console.log('Launch response:', text);

    if (!response.ok) {
      throw new Error(`EC2 API error: ${response.status} ${text}`);
    }

    // Parse XML response
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, "text/xml");
    
    const instanceId = xmlDoc.getElementsByTagName("instanceId")[0]?.textContent;
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