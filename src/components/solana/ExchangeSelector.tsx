import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ExchangeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function ExchangeSelector({ value, onChange, disabled }: ExchangeSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-serenity-mountain">Select Exchange</label>
      <Select
        value={value}
        onValueChange={onChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select an exchange" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="binance">Binance</SelectItem>
          <SelectItem value="kraken">Kraken</SelectItem>
          <SelectItem value="bybit">Bybit</SelectItem>
          <SelectItem value="kucoin">KuCoin</SelectItem>
          <SelectItem value="okx">OKX</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}