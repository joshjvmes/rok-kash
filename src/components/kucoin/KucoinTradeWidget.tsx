import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { fetchBalance, createOrder, fetchCCXTPrice } from "@/utils/exchanges/ccxt";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

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

interface TradeLog {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error';
}

export function KucoinTradeWidget() {
  const [availablePairs, setAvailablePairs] = useState<TradingPair[]>([]);
  const [selectedPair, setSelectedPair] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);
  const [tradeLogs, setTradeLogs] = useState<TradeLog[]>([]);
  const { toast } = useToast();

  // Fetch user's balance
  const { data: balanceData, isLoading: isLoadingBalance } = useQuery<Balance>({
    queryKey: ['balance', 'kucoin'],
    queryFn: () => fetchBalance('kucoin'),
    refetchInterval: 10000,
  });

  const addTradeLog = (message: string, type: 'info' | 'success' | 'error') => {
    const timestamp = new Date().toLocaleTimeString();
    setTradeLogs(prev => [...prev, { timestamp, message, type }]);
    // Also log to main console for global visibility
    if (type === 'error') {
      console.error(message);
    } else if (type === 'success') {
      console.info(message);
    } else {
      console.log(message);
    }
  };

  // Filter non-zero balances and generate trading pairs
  useEffect(() => {
    if (!balanceData?.total) return;

    const nonZeroBalances: { [key: string]: number } = {};
    Object.entries(balanceData.total).forEach(([coin, amount]) => {
      if (amount > 0) {
        nonZeroBalances[coin] = amount;
      }
    });

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

  // Fetch estimated price when pair changes
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

    return () => {
      isMounted = false;
    };
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

    addTradeLog(`Initiating ${side} order for ${amount} ${selectedPair}...`, 'info');

    try {
      const order = await createOrder('kucoin', selectedPair, 'market', side, parseFloat(amount));
      
      const successMessage = `${side.toUpperCase()} order placed successfully for ${amount} ${selectedPair}`;
      toast({
        title: "Success",
        description: successMessage,
      });
      addTradeLog(successMessage, 'success');
      addTradeLog(`Order details: ${JSON.stringify(order)}`, 'info');
      
      // Reset amount after successful trade
      setAmount("");
    } catch (error: any) {
      const errorMessage = `Failed to place ${side} order: ${error.message}`;
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      addTradeLog(errorMessage, 'error');
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              Estimated Price: ${estimatedPrice}
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

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Trade Status</h2>
        <ScrollArea className="h-[400px] w-full rounded-md border p-4">
          <div className="space-y-2">
            {tradeLogs.map((log, index) => (
              <div
                key={index}
                className={`text-sm ${
                  log.type === 'error' ? 'text-red-500' :
                  log.type === 'success' ? 'text-green-500' :
                  'text-gray-500'
                }`}
              >
                <span className="text-gray-400">[{log.timestamp}]</span> {log.message}
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}