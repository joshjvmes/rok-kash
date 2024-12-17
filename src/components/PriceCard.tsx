import { Card } from "@/components/ui/card";
import { ArrowUp, ArrowDown } from "lucide-react";
import { useNavigate } from "react-router-dom";

export interface PriceCardProps {
  symbol: string;
  price: string;
  change: number;
  exchange: string;
}

export function PriceCard({ symbol, price, change, exchange }: PriceCardProps) {
  const isPositive = change >= 0;
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/trading/${encodeURIComponent(symbol)}`);
  };

  return (
    <Card 
      className="p-4 bg-trading-gray hover:bg-trading-gray-light transition-colors cursor-pointer"
      onClick={handleClick}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm text-gray-400">{exchange}</h3>
          <p className="text-lg font-semibold">{symbol}</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold">${price}</p>
          <p className={`flex items-center gap-1 text-sm ${isPositive ? 'text-trading-green' : 'text-trading-red'}`}>
            {isPositive ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
            {Math.abs(change)}%
          </p>
        </div>
      </div>
    </Card>
  );
}