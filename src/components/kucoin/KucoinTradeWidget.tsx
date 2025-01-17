import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { fetchBalance, createOrder, fetchCCXTPrice } from "@/utils/exchanges/ccxt";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Balance {
  [key: string]: number;
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
  const { toast } = useToast();

  // Fetch user's balance
  const { data: balanceData, isLoading: isLoadingBalance } = useQuery({
    queryKey: ['balance', 'kucoin'],
    queryFn: () => fetchBalance('kucoin'),
    refetchInterval: 10000,
  });

  // Filter non-zero balances
  const nonZeroBalances: Balance = {};
  if (balanceData?.total) {
    Object.entries(balanceData.total).forEach(([coin, amount]) => {
      if (amount > 0) {
        nonZeroBalances[coin] = amount;
      }
    });
  }

  // Generate available trading pairs from balances
  useEffect(() => {
    const pairs: TradingPair[] = [];
    Object.keys(nonZeroBalances).forEach(baseAsset => {
      // Common quote assets in KuCoin
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
  }, [nonZeroBalances]);

  // Fetch estimated price when pair changes
  useEffect(() => {
    const fetchPrice = async () => {
      if (selectedPair) {
        try {
          const price = await fetchCCXTPrice('kucoin', selectedPair);
          setEstimatedPrice(price);
        } catch (error) {
          console.error('Error fetching price:', error);
        }
      }
    };
    fetchPrice();
  }, [selectedPair]);

  const handleTrade = async (side: 'buy' | 'sell') => {
    if (!selectedPair || !amount) {
      toast({
        title: "Error",
        description: "Please select a trading pair and enter an amount",
        variant: "destructive",
      });
      return;
    }

    try {
      const order = await createOrder('kucoin', selectedPair, 'market', side, parseFloat(amount));
      toast({
        title: "Success",
        description: `${side.toUpperCase()} order placed successfully`,
      });
      console.log('Order placed:', order);
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to place ${side} order: ${error.message}`,
        variant: "destructive",
      });
      console.error('Trade error:', error);
    }
  };

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
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">KuCoin Trade</h2>
      
      <div className="space-y-4">
        <div>
          <label className="text-sm text-gray-500 mb-2 block">Trading Pair</label>
          <Select
            value={selectedPair}
            onValueChange={setSelectedPair}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select trading pair" />
            </SelectTrigger>
            <SelectContent>
              {availablePairs.map((pair) => (
                <SelectItem key={pair.symbol} value={pair.symbol}>
                  {pair.symbol}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm text-gray-500 mb-2 block">Amount</label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount..."
          />
        </div>

        {estimatedPrice && (
          <div className="text-sm text-gray-500">
            Estimated Price: {estimatedPrice} USDT
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Button
            onClick={() => handleTrade('buy')}
            className="w-full bg-green-500 hover:bg-green-600"
          >
            Buy
          </Button>
          <Button
            onClick={() => handleTrade('sell')}
            className="w-full bg-red-500 hover:bg-red-600"
          >
            Sell
          </Button>
        </div>
      </div>
    </Card>
  );
}