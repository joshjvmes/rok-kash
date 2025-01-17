import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface TradeButtonsProps {
  onBuy: () => void;
  onSell: () => void;
  isLoading?: boolean;
}

export function TradeButtons({ onBuy, onSell, isLoading }: TradeButtonsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Button
        onClick={onBuy}
        className="w-full bg-green-500 hover:bg-green-600"
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          'Buy'
        )}
      </Button>
      <Button
        onClick={onSell}
        className="w-full bg-red-500 hover:bg-red-600"
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