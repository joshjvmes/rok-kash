import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { fetchBalance } from "@/utils/exchanges/ccxt";
import { Loader2 } from "lucide-react";

interface BalanceData {
  total: {
    [key: string]: number;
  };
}

export function OkxAccountInfo() {
  const { data: balance, isLoading } = useQuery<BalanceData>({
    queryKey: ['balance', 'okx'],
    queryFn: () => fetchBalance('okx'),
    refetchInterval: 360000, // 6 minutes
  });

  if (isLoading) {
    return (
      <Card className="prenity-white shadow-lg border border-serenity-sky-light">
        <div className="flex items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin text-serenity-sky-dark" />
          <p className="text-sm text-serenity-mountain ml-2">Loading balance...</p>
        </div>
      </Card>
    );
  }

  const nonZeroBalances = balance?.total ? 
    Object.entries(balance.total)
      .filter(([_, amount]) => amount > 0)
      .sort(([coinA], [coinB]) => coinA.localeCompare(coinB)) : [];

  return (
    <Card className="p-4 bg-serenity-white shadow-lg border border-serenity-sky-light">
      <h3 className="text-lg font-semibold mb-4 text-serenity-mountain">OKX Account Overview</h3>
      <div className="space-y-2">
        {nonZeroBalances.length > 0 ? (
          nonZeroBalances.map(([coin, amount]) => (
            <div key={coin} className="flex justify-between text-sm">
              <span className="text-serenity-mountain">{coin}</span>
              <span className="text-serenity-mountain font-medium">{Number(amount).toFixed(8)}</span>
            </div>
          ))
        ) : (
          <p className="text-sm text-serenity-mountain">No balance found</p>
        )}
      </div>
    </Card>
  );
}