import { ArrowRight } from "lucide-react";

interface ArbitrageHeaderProps {
  buyExchange: string;
  sellExchange: string;
  symbol: string;
}

export function ArbitrageHeader({ buyExchange, sellExchange, symbol }: ArbitrageHeaderProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-400">{buyExchange}</span>
        <ArrowRight size={16} className="text-trading-blue" />
        <span className="text-sm text-gray-400">{sellExchange}</span>
      </div>
      <span className="text-sm font-semibold">{symbol}</span>
    </div>
  );
}