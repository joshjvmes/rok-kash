import { Card } from "@/components/ui/card";
import { TradingHistory } from "@/components/TradingHistory";

export default function TradeHistory() {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Trade History</h2>
        <div className="grid gap-6">
          <TradingHistory exchange="all" symbol="all" />
        </div>
      </Card>
    </div>
  );
}