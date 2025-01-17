import { Button } from "@/components/ui/button";

interface TradeButtonsProps {
  onBuy: () => void;
  onSell: () => void;
}

export function TradeButtons({ onBuy, onSell }: TradeButtonsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Button
        onClick={onBuy}
        className="w-full bg-green-500 hover:bg-green-600"
      >
        Buy
      </Button>
      <Button
        onClick={onSell}
        className="w-full bg-red-500 hover:bg-red-600"
      >
        Sell
      </Button>
    </div>
  );
}