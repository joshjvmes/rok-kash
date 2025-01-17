import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ExchangeSelectorProps {
  selectedExchange: string;
  onExchangeChange: (value: string) => void;
}

export function ExchangeSelector({ selectedExchange, onExchangeChange }: ExchangeSelectorProps) {
  return (
    <div>
      <label className="text-sm text-serenity-mountain mb-2 block">Exchange</label>
      <Select
        value={selectedExchange}
        onValueChange={onExchangeChange}
      >
        <SelectTrigger className="bg-white border-serenity-sky-dark">
          <SelectValue placeholder="Select exchange" />
        </SelectTrigger>
        <SelectContent className="bg-white">
          <SelectItem value="bybit">Bybit</SelectItem>
          <SelectItem value="kraken">Kraken</SelectItem>
          <SelectItem value="binance">Binance</SelectItem>
          <SelectItem value="kucoin">Kucoin</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}