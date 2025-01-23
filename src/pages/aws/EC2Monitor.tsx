import { EC2Manager } from "@/components/aws/EC2Manager";
import { ArbitrageScanner } from "@/components/aws/ArbitrageScanner";
import { ArbitrageClusterManager } from "@/components/aws/ArbitrageClusterManager";

const EC2Monitor = () => {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">EC2 Instance Monitor</h1>
      <p className="text-muted-foreground">
        Manage and monitor your AWS EC2 instances for arbitrage scanning.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <ArbitrageScanner />
        <ArbitrageClusterManager />
      </div>
      <EC2Manager />
    </div>
  );
};

export default EC2Monitor;