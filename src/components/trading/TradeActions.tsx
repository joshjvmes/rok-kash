import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface TradeActionsProps {
  onBuy: () => void;
  onSell: () => void;
  onSellAll: () => void;
  isLoading: boolean;
}

export function TradeActions({ onBuy, onSell, onSellAll, isLoading }: TradeActionsProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
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
      <Button
        variant="outline"
        className="w-full border-trading-red text-trading-red hover:bg-trading-red/10"
        onClick={onSellAll}
        disabled={isLoading}
      >
        Sell All
      </Button>
    </div>
  );
}