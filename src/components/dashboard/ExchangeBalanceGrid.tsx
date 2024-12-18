import { ExchangeBalance } from "@/components/ExchangeBalance";

interface ExchangeBalanceGridProps {
  exchanges: string[];
}

export function ExchangeBalanceGrid({ exchanges }: ExchangeBalanceGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {exchanges.map((exchange) => (
        <ExchangeBalance key={exchange} exchange={exchange} />
      ))}
    </div>
  );
}