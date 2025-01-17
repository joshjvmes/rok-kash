import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { fetchBalance, fetchCCXTPrice } from "@/utils/exchanges/ccxt";
import { Loader2, Database, CreditCard, User, DollarSign } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState } from "react";

interface BalanceData {
  total: {
    [key: string]: number;
  };
}

interface TokenValue {
  balance: number;
  usdValue: number;
}

interface TokenValues {
  [key: string]: TokenValue;
}

export function BinanceAccountInfo() {
  const [tokenValues, setTokenValues] = useState<TokenValues>({});
  const [totalUSDValue, setTotalUSDValue] = useState<number>(0);

  const { data: balance, isLoading } = useQuery<BalanceData>({
    queryKey: ['balance', 'binance'],
    queryFn: () => fetchBalance('binance'),
    refetchInterval: 360000, // 6 minutes
  });

  useEffect(() => {
    async function fetchPrices() {
      if (!balance?.total) return;

      const newTokenValues: TokenValues = {};
      let newTotalUSD = 0;

      for (const [coin, amount] of Object.entries(balance.total)) {
        if (amount > 0) {
          try {
            // Skip price fetch for stablecoins
            let usdValue = amount;
            if (!['USDT', 'USDC', 'DAI'].includes(coin)) {
              const price = await fetchCCXTPrice('binance', `${coin}/USDT`);
              usdValue = price ? amount * price : 0;
            }
            
            newTokenValues[coin] = {
              balance: amount,
              usdValue: usdValue
            };
            newTotalUSD += usdValue;
          } catch (error) {
            console.error(`Error fetching price for ${coin}:`, error);
            newTokenValues[coin] = {
              balance: amount,
              usdValue: 0
            };
          }
        }
      }

      setTokenValues(newTokenValues);
      setTotalUSDValue(newTotalUSD);
    }

    fetchPrices();
  }, [balance]);

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

  const sortedTokens = Object.entries(tokenValues)
    .sort(([, a], [, b]) => b.usdValue - a.usdValue);

  return (
    <Card className="p-6 bg-serenity-white shadow-lg border border-serenity-sky-light">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-serenity-mountain flex items-center gap-2">
            <Database className="h-5 w-5" />
            Binance Account Overview
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
              <span className="text-sm text-serenity-mountain">Total Assets (USD)</span>
            </div>
            <p className="text-xl font-bold text-serenity-mountain mt-2">
              ${totalUSDValue.toFixed(2)}
            </p>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-serenity-sky-light to-white">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-serenity-sky-dark" />
              <span className="text-sm text-serenity-mountain">Active Assets</span>
            </div>
            <p className="text-xl font-bold text-serenity-mountain mt-2">
              {sortedTokens.length} Coins
            </p>
          </Card>
        </div>

        <Separator className="my-4" />

        <div>
          <h3 className="text-sm font-medium text-serenity-mountain mb-2">Asset Distribution</h3>
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {sortedTokens.map(([coin, value], index) => (
                <div 
                  key={`${coin}-${index}`} 
                  className="flex justify-between items-center p-2 hover:bg-gray-50 rounded"
                >
                  <div>
                    <span className="text-sm font-medium text-serenity-mountain">{coin}</span>
                    <span className="text-xs text-gray-500 ml-2">({value.balance.toFixed(8)})</span>
                  </div>
                  <span className="text-sm text-serenity-mountain">${value.usdValue.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </Card>
  );
}