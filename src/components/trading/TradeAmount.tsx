import { Input } from "@/components/ui/input";

interface TradeAmountProps {
  amount: string;
  onAmountChange: (value: string) => void;
  isLoading: boolean;
}

export function TradeAmount({ amount, onAmountChange, isLoading }: TradeAmountProps) {
  return (
    <div>
      <label className="text-sm text-gray-400 mb-2 block">Amount (USDC)</label>
      <Input
        type="number"
        value={amount}
        onChange={(e) => onAmountChange(e.target.value)}
        className="bg-trading-gray-light border-trading-gray-light"
        placeholder="Enter amount..."
        disabled={isLoading}
      />
    </div>
  );
}