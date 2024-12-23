import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { fetchBalance } from "@/utils/exchanges/ccxt";
import { Loader2 } from "lucide-react";

interface ExchangeBalanceProps {
  exchange: string;
}

export function ExchangeBalance({ exchange }: ExchangeBalanceProps) {
  const { data: balance, isLoading, error } = useQuery({
    queryKey: ['balance', exchange],
    queryFn: () => fetchBalance(exchange),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <Card className="p-4 bg-trading-gray">
        <div className="flex items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin" />
          <p className="text-sm text-gray-400 ml-2">Loading balance...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-4 bg-trading-gray">
        <p className="text-sm text-red-400">Error loading balance</p>
      </Card>
    );
  }

  const nonZeroBalances = Object.entries(balance?.total || {}).filter(
    ([_, amount]) => Number(amount) > 0
  );

  return (
    <Card className="p-4 bg-trading-gray">
      <h3 className="text-lg font-semibold mb-4 capitalize">{exchange}</h3>
      <div className="space-y-2 max-h-48 overflow-y-auto">
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