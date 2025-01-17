import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const EXCHANGES = ['binance', 'kraken', 'kucoin', 'okx'];

interface ExchangeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function ExchangeSelector({ value, onChange }: ExchangeSelectorProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select exchange" />
      </SelectTrigger>
      <SelectContent>
        {EXCHANGES.map((exchange) => (
          <SelectItem key={exchange} value={exchange}>
            {exchange.charAt(0).toUpperCase() + exchange.slice(1)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export { EXCHANGES };