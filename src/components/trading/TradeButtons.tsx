import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface TradeButtonsProps {
  onBuy: () => void;
  onSell: () => void;
  isLoading: boolean;
}

export function TradeButtons({ onBuy, onSell, isLoading }: TradeButtonsProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Button
        className="w-full bg-trading-green hover:bg-trading-green/90"
        onClick={onBuy}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          'Buy'
        )}
      </Button>
      <Button
        className="w-full bg-trading-red hover:bg-trading-red/90"
        onClick={onSell}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          'Sell'
        )}
      </Button>
    </div>
  );
}