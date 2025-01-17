import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { fetchBalance, fetchCCXTPrice } from "@/utils/exchanges/ccxt";
import { Loader2 } from "lucide-react";
import { TradingPairSelector } from "./TradingPairSelector";
import { TradeAmountInput } from "./TradeAmountInput";
import { TradeButtons } from "./TradeButtons";
import { TradeStatusLogs } from "./TradeStatusLogs";
import { PriceEstimation } from "./PriceEstimation";
import { ActiveOrderDisplay } from "./ActiveOrderDisplay";
import { useKucoinOrder } from "@/hooks/useKucoinOrder";

interface Balance {
  total: {
    [key: string]: number;
  };
}

interface TradingPair {
  baseAsset: string;
  quoteAsset: string;
  symbol: string;
}

export function KucoinTradeWidget() {
  const [availablePairs, setAvailablePairs] = useState<TradingPair[]>([]);
  const [selectedPair, setSelectedPair] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);
  const [estimatedReceiveAmount, setEstimatedReceiveAmount] = useState<string>("");
  
  const { 
    activeOrder, 
    tradeLogs, 
    handleTrade, 
    handleCancelOrder, 
    addTradeLog 
  } = useKucoinOrder();

  const { data: balanceData, isLoading: isLoadingBalance } = useQuery({
    queryKey: ['balance', 'kucoin'],
    queryFn: () => fetchBalance('kucoin') as Promise<Balance>,
    refetchInterval: 10000,
  });

  useEffect(() => {
    if (amount && estimatedPrice) {
      const numericAmount = parseFloat(amount);
      const total = numericAmount * estimatedPrice;
      setEstimatedReceiveAmount(total.toFixed(8));
    } else {
      setEstimatedReceiveAmount("");
    }
  }, [amount, estimatedPrice]);

  useEffect(() => {
    if (!balanceData?.total) return;

    const nonZeroBalances = Object.entries(balanceData.total)
      .filter(([_, amount]) => typeof amount === 'number' && amount > 0)
      .reduce((acc, [coin, amount]) => {
        acc[coin] = amount;
        return acc;
      }, {} as { [key: string]: number });

    const pairs: TradingPair[] = [];
    Object.keys(nonZeroBalances).forEach(baseAsset => {
      const quoteAssets = ['USDT', 'USDC', 'BTC', 'ETH'];
      quoteAssets.forEach(quoteAsset => {
        if (baseAsset !== quoteAsset) {
          pairs.push({
            baseAsset,
            quoteAsset,
            symbol: `${baseAsset}/${quoteAsset}`
          });
        }
      });
    });

    setAvailablePairs(pairs);
    if (pairs.length > 0 && !selectedPair) {
      setSelectedPair(pairs[0].symbol);
    }
  }, [balanceData, selectedPair]);

  useEffect(() => {
    let isMounted = true;

    const fetchPrice = async () => {
      if (selectedPair) {
        try {
          addTradeLog(`Fetching price for ${selectedPair}...`, 'info');
          const price = await fetchCCXTPrice('kucoin', selectedPair);
          if (isMounted) {
            setEstimatedPrice(price);
            if (price) {
              addTradeLog(`Current price for ${selectedPair}: $${price}`, 'info');
            }
          }
        } catch (error) {
          if (isMounted) {
            addTradeLog(`Error fetching price: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
          }
        }
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 10000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [selectedPair, addTradeLog]);

  if (isLoadingBalance) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="ml-2">Loading balances...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">KuCoin Trade</h2>
        
        <div className="space-y-4">
          <TradingPairSelector
            availablePairs={availablePairs}
            selectedPair={selectedPair}
            onPairSelect={setSelectedPair}
          />

          <TradeAmountInput
            amount={amount}
            onAmountChange={setAmount}
            estimatedPrice={estimatedPrice}
            estimatedReceiveAmount={estimatedReceiveAmount}
          />

          <PriceEstimation
            estimatedPrice={estimatedPrice}
            estimatedReceiveAmount={estimatedReceiveAmount}
            selectedPair={selectedPair}
          />

          <TradeButtons
            onBuy={() => handleTrade('buy', selectedPair, amount)}
            onSell={() => handleTrade('sell', selectedPair, amount)}
          />

          <ActiveOrderDisplay
            activeOrder={activeOrder}
            onCancel={handleCancelOrder}
          />
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Trade Status</h2>
        <TradeStatusLogs logs={tradeLogs} />
      </Card>
    </div>
  );
}