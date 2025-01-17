import { TotalExchangeBalance } from "@/components/TotalExchangeBalance";
import { Card } from "@/components/ui/card";

export default function Balances() {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Exchange Balances</h2>
        <TotalExchangeBalance />
      </Card>
    </div>
  );
}