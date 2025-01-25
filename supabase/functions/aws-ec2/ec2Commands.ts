import { EC2Client } from "npm:@aws-sdk/client-ec2";
import {
  DescribeInstancesCommand,
  RunInstancesCommand,
  StopInstancesCommand
} from "npm:@aws-sdk/client-ec2";

export const getEC2Client = () => {
  return new EC2Client({
    region: "us-east-1",
    credentials: {
      accessKeyId: Deno.env.get('AWS_ACCESS_KEY_ID')!,
      secretAccessKey: Deno.env.get('AWS_SECRET_ACCESS_KEY')!,
    },
  });
};

export const fetchInstanceStatus = async (ec2Client: EC2Client) => {
  const command = new DescribeInstancesCommand({});
  const response = await ec2Client.send(command);
  
  const instances = response.Reservations?.flatMap(r => r.Instances || []) || [];
  return instances;
};

export const fetchScannerStatus = async (ec2Client: EC2Client) => {
  return fetchInstanceStatus(ec2Client);
};

export const launchEC2Instance = async (ec2Client: EC2Client, test = false) => {
  const command = new RunInstancesCommand({
    ImageId: "ami-0c7217cdde317cfec",
    InstanceType: "t2.micro",
    MinCount: 1,
    MaxCount: 1,
    TagSpecifications: [
      {
        ResourceType: "instance",
        Tags: [
          {
            Key: "Name",
            Value: test ? "ArbitrageScannerTest" : "ArbitrageScanner",
          },
        ],
      },
    ],
  });

  const response = await ec2Client.send(command);
  return response.Instances?.[0].InstanceId;
};

export const stopEC2Instance = async (ec2Client: EC2Client, instanceId: string) => {
  const command = new StopInstancesCommand({
    InstanceIds: [instanceId],
  });
  
  await ec2Client.send(command);
};