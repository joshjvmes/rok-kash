import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export function QuickTrade() {
  const [amount, setAmount] = useState("");

  return (
    <Card className="p-6 bg-trading-gray">
      <h2 className="text-lg font-semibold mb-4">Quick Trade</h2>
      <div className="space-y-4">
        <div>
          <label className="text-sm text-gray-400">Amount (USD)</label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="bg-trading-gray-light border-trading-gray-light"
            placeholder="Enter amount..."
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button className="w-full bg-trading-green hover:bg-trading-green/90">Buy</Button>
          <Button className="w-full bg-trading-red hover:bg-trading-red/90">Sell</Button>
        </div>
      </div>
    </Card>
  );
}