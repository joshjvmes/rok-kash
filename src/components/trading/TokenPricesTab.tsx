import { PriceCardsGrid } from "./PriceCardsGrid";
import type { PriceCardProps } from "@/components/PriceCard";

interface TokenPricesTabProps {
  groupedPrices: Record<string, PriceCardProps[]>;
  symbols: string[];
}

export function TokenPricesTab({ groupedPrices, symbols }: TokenPricesTabProps) {
  return (
    <div className="space-y-4">
      {symbols.map((symbol) => (
        groupedPrices[symbol] && (
          <PriceCardsGrid
            key={symbol}
            symbol={symbol}
            prices={groupedPrices[symbol]}
          />
        )
      ))}
    </div>
  );
}