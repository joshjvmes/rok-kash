import { PriceCard } from "@/components/PriceCard";

interface PriceGridProps {
  groupedPrices: Record<string, any[]>;
}

export function PriceGrid({ groupedPrices }: PriceGridProps) {
  return (
    <div className="space-y-4">
      {Object.entries(groupedPrices).map(([symbol, symbolPrices]) => (
        <div key={symbol} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {symbolPrices.map((price) => (
            <PriceCard key={`${price.exchange}-${price.symbol}`} {...price} />
          ))}
        </div>
      ))}
    </div>
  );
}