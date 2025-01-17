import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { fetchBalance, createOrder, fetchCCXTPrice, cancelOrder } from "@/utils/exchanges/ccxt";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TradingPairSelector } from "./TradingPairSelector";
import { TradeAmountInput } from "./TradeAmountInput";
import { TradeButtons } from "./TradeButtons";
import { TradeStatusLogs } from "./TradeStatusLogs";
import { Button } from "@/components/ui/button";

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

interface ActiveOrder {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  amount: number;
  status: string;
}

export function KucoinTradeWidget() {
  const [availablePairs, setAvailablePairs] = useState<TradingPair[]>([]);
  const [selectedPair, setSelectedPair] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);
  const [estimatedReceiveAmount, setEstimatedReceiveAmount] = useState<string>("");
  const [tradeLogs, setTradeLogs] = useState<TradeLog[]>([]);
  const [activeOrder, setActiveOrder] = useState<ActiveOrder | null>(null);
  const { toast } = useToast();

  const { data: balanceData, isLoading: isLoadingBalance } = useQuery({
    queryKey: ['balance', 'kucoin'],
    queryFn: () => fetchBalance('kucoin'),
    refetchInterval: 10000,
  });

  const addTradeLog = (message: string, type: 'info' | 'success' | 'error') => {
    const timestamp = new Date().toLocaleTimeString();
    setTradeLogs(prev => [...prev, { timestamp, message, type }]);
    if (type === 'error') {
      console.error(message);
    } else if (type === 'success') {
      console.info(message);
    } else {
      console.log(message);
    }
  };

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
      .filter(([_, amount]) => amount > 0)
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
  }, [selectedPair]);

  const handleCancelOrder = async () => {
    if (!activeOrder) {
      addTradeLog('No active order to cancel', 'error');
      return;
    }

    try {
      addTradeLog(`Attempting to cancel order ${activeOrder.id}...`, 'info');
      await cancelOrder('kucoin', activeOrder.id, activeOrder.symbol);
      
      addTradeLog(`Successfully cancelled order ${activeOrder.id}`, 'success');
      toast({
        title: "Order Cancelled",
        description: `Successfully cancelled ${activeOrder.side} order for ${activeOrder.amount} ${activeOrder.symbol}`,
      });
      
      setActiveOrder(null);
      setAmount("");
    } catch (error: any) {
      const errorMessage = `Failed to cancel order: ${error.message}`;
      addTradeLog(errorMessage, 'error');
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

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
      
      if (!order || !order.id) {
        throw new Error('Order creation failed - no order ID received');
      }

      setActiveOrder({
        id: order.id,
        symbol: selectedPair,
        side,
        amount: parseFloat(amount),
        status: order.status || 'pending'
      });
      
      const successMessage = `${side.toUpperCase()} order placed successfully for ${amount} ${selectedPair}`;
      toast({
        title: "Success",
        description: successMessage,
      });
      addTradeLog(successMessage, 'success');
      addTradeLog(`Order details: ${JSON.stringify(order)}`, 'info');
      
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

          <TradeButtons
            onBuy={() => handleTrade('buy')}
            onSell={() => handleTrade('sell')}
          />

          {activeOrder && (
            <div className="mt-4">
              <div className="text-sm text-gray-500 mb-2">
                Active Order: {activeOrder.side.toUpperCase()} {activeOrder.amount} {activeOrder.symbol}
              </div>
              <Button 
                variant="destructive" 
                onClick={handleCancelOrder}
                className="w-full"
              >
                Cancel Order
              </Button>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Trade Status</h2>
        <TradeStatusLogs logs={tradeLogs} />
      </Card>
    </div>
  );
}