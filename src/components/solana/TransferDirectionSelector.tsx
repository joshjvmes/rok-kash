import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowRightLeft } from "lucide-react";

interface TransferDirectionSelectorProps {
  fromType: 'wallet' | 'exchange';
  toType: 'wallet' | 'exchange';
  onFromTypeChange: (value: 'wallet' | 'exchange') => void;
  onToTypeChange: (value: 'wallet' | 'exchange') => void;
  onSwapDirection: () => void;
  isDisabled: boolean;
}

export function TransferDirectionSelector({
  fromType,
  toType,
  onFromTypeChange,
  onToTypeChange,
  onSwapDirection,
  isDisabled
}: TransferDirectionSelectorProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex-1">
        <Select
          value={fromType}
          onValueChange={onFromTypeChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="From" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="wallet">Phantom Wallet</SelectItem>
            <SelectItem value="exchange">Exchange</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={onSwapDirection}
        className="rounded-full"
        disabled={isDisabled}
      >
        <ArrowRightLeft className="h-4 w-4" />
      </Button>

      <div className="flex-1">
        <Select
          value={toType}
          onValueChange={onToTypeChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="To" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="wallet">Phantom Wallet</SelectItem>
            <SelectItem value="exchange">Exchange</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}