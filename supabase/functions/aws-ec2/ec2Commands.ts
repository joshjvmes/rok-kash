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
  try {
    const command = new DescribeInstancesCommand({});
    const response = await ec2Client.send(command);
    
    const instances = response.Reservations?.flatMap(
      (reservation) => reservation.Instances || []
    ) || [];
    
    console.log(`Found ${instances.length} EC2 instances`);
    return instances;
  } catch (error) {
    console.error("Error fetching EC2 instances:", error);
    throw error;
  }
};

export const fetchScannerStatus = async (ec2Client: EC2Client) => {
  try {
    const instances = await fetchInstanceStatus(ec2Client);
    console.log("Scanner instances status:", instances.map(i => ({
      id: i.InstanceId,
      state: i.State?.Name
    })));
    return instances;
  } catch (error) {
    console.error("Error fetching scanner status:", error);
    throw error;
  }
};

export const launchEC2Instance = async (ec2Client: EC2Client, isTest = false) => {
  try {
    const command = new RunInstancesCommand({
      ImageId: "ami-0c7217cdde317cfec", // Amazon Linux 2023 AMI
      InstanceType: isTest ? "t2.micro" : "t2.small",
      MinCount: 1,
      MaxCount: 1,
      TagSpecifications: [
        {
          ResourceType: "instance",
          Tags: [
            {
              Key: "Name",
              Value: isTest ? "Arbitrage-Scanner-Test" : "Arbitrage-Scanner",
            },
          ],
        },
      ],
    });

    const response = await ec2Client.send(command);
    const instanceId = response.Instances?.[0]?.InstanceId;
    
    if (!instanceId) {
      throw new Error("Failed to get instance ID from launch response");
    }

    console.log(`Successfully launched EC2 instance: ${instanceId}`);
    return instanceId;
  } catch (error) {
    console.error("Error launching EC2 instance:", error);
    throw error;
  }
};

export const startEC2Instance = async (ec2Client: EC2Client, instanceId: string) => {
  try {
    const command = new StartInstancesCommand({
      InstanceIds: [instanceId],
    });
    
    await ec2Client.send(command);
    console.log(`Successfully started EC2 instance: ${instanceId}`);
    return true;
  } catch (error) {
    console.error(`Error starting EC2 instance ${instanceId}:`, error);
    throw error;
  }
};

export const stopEC2Instance = async (ec2Client: EC2Client, instanceId: string) => {
  try {
    const command = new StopInstancesCommand({
      InstanceIds: [instanceId],
    });
    
    await ec2Client.send(command);
    console.log(`Successfully stopped EC2 instance: ${instanceId}`);
    return true;
  } catch (error) {
    console.error(`Error stopping EC2 instance ${instanceId}:`, error);
    throw error;
  }
};