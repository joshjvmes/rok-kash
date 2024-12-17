import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TradeTypeProps {
  type: string;
  onTypeChange: (value: string) => void;
  isLoading: boolean;
}

export function TradeType({ type, onTypeChange, isLoading }: TradeTypeProps) {
  return (
    <div>
      <label className="text-sm text-gray-400 mb-2 block">Order Type</label>
      <Select
        value={type}
        onValueChange={onTypeChange}
        disabled={isLoading}
      >
        <SelectTrigger className="bg-trading-gray-light border-trading-gray-light">
          <SelectValue placeholder="Select order type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="market">Market</SelectItem>
          <SelectItem value="limit">Limit</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}