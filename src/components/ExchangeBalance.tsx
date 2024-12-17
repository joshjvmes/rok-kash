import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { fetchBalance } from "@/utils/exchanges/ccxt";

interface ExchangeBalanceProps {
  exchange: string;
}

export function ExchangeBalance({ exchange }: ExchangeBalanceProps) {
  const { data: balance, isLoading } = useQuery({
    queryKey: ['balance', exchange],
    queryFn: () => fetchBalance(exchange),
    refetchInterval: false, // Disable auto-refresh
  });

  if (isLoading) {
    return (
      <Card className="p-4 bg-trading-gray">
        <p className="text-sm text-gray-400">Loading balance...</p>
      </Card>
    );
  }

  const nonZeroBalances = Object.entries(balance?.total || {}).filter(
    ([_, amount]) => Number(amount) > 0
  );

  return (
    <Card className="p-4 bg-trading-gray">
      <h3 className="text-lg font-semibold mb-4">{exchange} Balance</h3>
      <div className="space-y-2">
        {nonZeroBalances.map(([currency, amount]) => (
          <div key={currency} className="flex justify-between text-sm">
            <span className="text-gray-400">{currency}</span>
            <span>{Number(amount).toFixed(8)}</span>
          </div>
        ))}
        {nonZeroBalances.length === 0 && (
          <p className="text-sm text-gray-400">No balance available</p>
        )}
      </div>
    </Card>
  );
}