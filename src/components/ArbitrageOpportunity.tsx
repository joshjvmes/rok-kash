import { Card } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ArbitrageOpportunityProps {
  buyExchange: string;
  sellExchange: string;
  symbol: string;
  spread: number;
  potential: number;
}

export function ArbitrageOpportunity({
  buyExchange,
  sellExchange,
  symbol,
  spread,
  potential,
}: ArbitrageOpportunityProps) {
  return (
    <Card className="p-4 bg-trading-gray hover:bg-trading-gray-light transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">{buyExchange}</span>
            <ArrowRight size={16} className="text-trading-blue" />
            <span className="text-sm text-gray-400">{sellExchange}</span>
          </div>
          <span className="text-sm font-semibold">{symbol}</span>
        </div>
        <div className="flex items-center gap-4">
          <div>
            <p className="text-sm text-gray-400">Spread</p>
            <p className="text-trading-green font-semibold">{spread}%</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Potential</p>
            <p className="text-trading-green font-semibold">${potential}</p>
          </div>
          <Button variant="outline" className="ml-2">Execute</Button>
        </div>
      </div>
    </Card>
  );
}