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

  // Format price based on the asset and price value
  const formatPrice = (price: string, symbol: string) => {
    const numericPrice = parseFloat(price);
    
    // For lower value assets (like PEPE, BONK) or when price < 1, show more decimals
    if (numericPrice < 1 || symbol.startsWith('PEPE') || symbol.startsWith('BONK')) {
      return numericPrice.toFixed(8);
    }
    // For mid-range assets (like SOL, AVAX) show 4 decimals
    else if (numericPrice < 1000 || symbol.startsWith('SOL') || symbol.startsWith('AVAX')) {
      return numericPrice.toFixed(4);
    }
    // For high-value assets (like BTC, ETH) show 2 decimals
    return numericPrice.toFixed(2);
  };

  return (
    <Card 
      className="p-2 bg-trading-gray hover:bg-trading-gray-light transition-colors cursor-pointer"
      onClick={handleClick}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xs text-gray-400">{exchange}</h3>
          <p className="text-sm font-semibold">{symbol}</p>
        </div>
        <div className="text-right">
          <p className="text-base font-bold">${formatPrice(price, symbol)}</p>
          <p className={`flex items-center gap-0.5 text-xs ${isPositive ? 'text-trading-green' : 'text-trading-red'}`}>
            {isPositive ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
            {Math.abs(change)}%
          </p>
        </div>
      </div>
    </Card>
  );
}