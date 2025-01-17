import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { fetchBalance } from "@/utils/exchanges/ccxt";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const EXCHANGES = ['bybit', 'kraken', 'binance', 'kucoin', 'okx'];

interface BalanceData {
  total: {
    [key: string]: number;
  };
}

export function TotalExchangeBalance() {
  // Fetch balances for all exchanges
  const balanceQueries = EXCHANGES.map(exchange => 
    useQuery<BalanceData>({
      queryKey: ['balance', exchange],
      queryFn: () => fetchBalance(exchange),
      refetchInterval: 3600000, // Changed from 30000 to 3600000 (1 hour)
    })
  );

  const isLoading = balanceQueries.some(query => query.isLoading);
  const hasError = balanceQueries.some(query => query.error);

  // Combine all balances
  const totalBalances: { [key: string]: number } = {};
  balanceQueries.forEach(query => {
    if (query.data?.total) {
      Object.entries(query.data.total).forEach(([coin, amount]) => {
        totalBalances[coin] = (totalBalances[coin] || 0) + (amount as number);
      });
    }
  });

  const nonZeroBalances = Object.entries(totalBalances)
    .filter(([_, amount]) => amount > 0)
    .sort(([coinA], [coinB]) => coinA.localeCompare(coinB));

  if (isLoading) {
    return (
      <Card className="p-4 bg-serenity-white shadow-lg border border-serenity-sky-light">
        <div className="flex items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin text-serenity-sky-dark" />
          <p className="text-sm text-serenity-mountain ml-2">Loading total balance...</p>
        </div>
      </Card>
    );
  }

  if (hasError) {
    return (
      <Card className="p-4 bg-serenity-white shadow-lg border border-serenity-sky-light">
        <p className="text-sm text-red-400">Error loading total balance</p>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-serenity-white shadow-lg border border-serenity-sky-light">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-serenity-mountain">Total Balance</h3>
      </div>
      <ScrollArea className="h-[200px] pr-4">
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
      </ScrollArea>
    </Card>
  );
}