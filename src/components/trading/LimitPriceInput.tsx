import { Input } from "@/components/ui/input";

interface LimitPriceInputProps {
  price: string;
  onPriceChange: (value: string) => void;
  isLoading: boolean;
}

export function LimitPriceInput({ price, onPriceChange, isLoading }: LimitPriceInputProps) {
  return (
    <div>
      <label className="text-sm text-gray-400 mb-2 block">Limit Price (USDC)</label>
      <Input
        type="number"
        value={price}
        onChange={(e) => onPriceChange(e.target.value)}
        className="bg-trading-gray-light border-trading-gray-light"
        placeholder="Enter limit price..."
        disabled={isLoading}
      />
    </div>
  );
}