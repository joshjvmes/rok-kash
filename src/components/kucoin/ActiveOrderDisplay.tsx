import { Button } from "@/components/ui/button";

interface ActiveOrder {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  amount: number;
  status: string;
}

interface ActiveOrderDisplayProps {
  activeOrder: ActiveOrder | null;
  onCancel: () => void;
}

export function ActiveOrderDisplay({ activeOrder, onCancel }: ActiveOrderDisplayProps) {
  if (!activeOrder) return null;

  return (
    <div className="mt-4">
      <div className="text-sm text-gray-500 mb-2">
        Active Order: {activeOrder.side.toUpperCase()} {activeOrder.amount} {activeOrder.symbol}
      </div>
      <Button 
        variant="destructive" 
        onClick={onCancel}
        className="w-full"
      >
        Cancel Order
      </Button>
    </div>
  );
}