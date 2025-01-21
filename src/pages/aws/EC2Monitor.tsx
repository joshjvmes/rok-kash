import { EC2Manager } from "@/components/aws/EC2Manager";

const EC2Monitor = () => {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">EC2 Instance Monitor</h1>
      <p className="text-muted-foreground">
        Manage and monitor your AWS EC2 instances for arbitrage scanning.
      </p>
      <EC2Manager />
    </div>
  );
};

export default EC2Monitor;