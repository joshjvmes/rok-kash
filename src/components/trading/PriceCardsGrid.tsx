import { PriceCard } from "@/components/PriceCard";
import type { PriceCardProps } from "@/components/PriceCard";

interface PriceCardsGridProps {
  symbol: string;
  prices: PriceCardProps[];
}

export function PriceCardsGrid({ symbol, prices }: PriceCardsGridProps) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold text-rokcat-purple-light px-2">
        {symbol}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {prices.map((price) => (
          <PriceCard key={`${price.exchange}-${price.symbol}`} {...price} />
        ))}
      </div>
    </div>
  );
}