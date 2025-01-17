import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TradingPair {
  baseAsset: string;
  quoteAsset: string;
  symbol: string;
}

interface TradingPairSelectorProps {
  availablePairs: TradingPair[];
  selectedPair: string;
  onPairSelect: (pair: string) => void;
}

export function TradingPairSelector({ availablePairs, selectedPair, onPairSelect }: TradingPairSelectorProps) {
  return (
    <div>
      <label className="text-sm text-gray-500 mb-2 block">Trading Pair</label>
      <Select
        value={selectedPair}
        onValueChange={onPairSelect}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select trading pair" />
        </SelectTrigger>
        <SelectContent>
          {availablePairs.map((pair) => (
            <SelectItem key={pair.symbol} value={pair.symbol}>
              {pair.symbol}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}