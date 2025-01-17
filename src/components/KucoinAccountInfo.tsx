import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { fetchBalance } from "@/utils/exchanges/ccxt";
import { Loader2, Database, CreditCard, User, DollarSign } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export function KucoinAccountInfo() {
  const { data: balance, isLoading } = useQuery({
    queryKey: ['balance', 'kucoin'],
    queryFn: () => fetchBalance('kucoin'),
    refetchInterval: 360000, // 6 minutes
  });

  if (isLoading) {
    return (
      <Card className="p-4 bg-serenity-white shadow-lg border border-serenity-sky-light">
        <div className="flex items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin text-serenity-sky-dark" />
          <p className="text-sm text-serenity-mountain ml-2">Loading account information...</p>
        </div>
      </Card>
    );
  }

  const totalBalances = balance?.total || {};
  const nonZeroBalances = Object.entries(totalBalances)
    .filter(([_, amount]) => amount > 0)
    .sort(([coinA], [coinB]) => coinB.localeCompare(coinA));

  const totalUSDTValue = nonZeroBalances.reduce((acc, [_, amount]) => acc + Number(amount), 0);

  return (
    <Card className="p-6 bg-serenity-white shadow-lg border border-serenity-sky-light">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-serenity-mountain flex items-center gap-2">
            <Database className="h-5 w-5" />
            KuCoin Account Overview
          </h2>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-serenity-sky-dark" />
            <span className="text-sm text-serenity-mountain">Spot Account</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4 bg-gradient-to-br from-serenity-sky-light to-white">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-serenity-sky-dark" />
              <span className="text-sm text-serenity-mountain">Total Assets (Estimated)</span>
            </div>
            <p className="text-xl font-bold text-serenity-mountain mt-2">
              {totalUSDTValue.toFixed(2)} USDT
            </p>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-serenity-sky-light to-white">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-serenity-sky-dark" />
              <span className="text-sm text-serenity-mountain">Active Assets</span>
            </div>
            <p className="text-xl font-bold text-serenity-mountain mt-2">
              {nonZeroBalances.length} Coins
            </p>
          </Card>
        </div>

        <Separator className="my-4" />

        <div>
          <h3 className="text-sm font-medium text-serenity-mountain mb-2">Asset Distribution</h3>
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {nonZeroBalances.map(([coin, amount]) => (
                <div key={coin} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                  <span className="text-sm font-medium text-serenity-mountain">{coin}</span>
                  <span className="text-sm text-serenity-mountain">{Number(amount).toFixed(8)}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </Card>
  );
}