import { RebalanceWidget } from "@/components/trading/RebalanceWidget";

export default function RebalancePage() {
  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold mb-6 text-serenity-mountain">Rebalance Assets</h1>
      <RebalanceWidget />
    </div>
  );
}