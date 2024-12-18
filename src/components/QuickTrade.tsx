import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { createOrder, fetchBalance } from "@/utils/exchanges/ccxt";
import { useToast } from "@/hooks/use-toast";
import { ExchangeSelector } from "./trading/ExchangeSelector";
import { SymbolSelector } from "./trading/SymbolSelector";
import { TradeAmount } from "./trading/TradeAmount";
import { TradeButtons } from "./trading/TradeButtons";
import { TradeType } from "./trading/TradeType";
import { TradePercentage } from "./trading/TradePercentage";
import { Input } from "./ui/input";
import { useQuery } from "@tanstack/react-query";

export function QuickTrade() {
  const [amount, setAmount] = useState("");
  const [price, setPrice] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedExchange, setSelectedExchange] = useState("bybit");
  const [selectedSymbol, setSelectedSymbol] = useState("BTC/USDC");
  const [orderType, setOrderType] = useState("market");
  const { toast } = useToast();

  // Fetch balance for the selected token
  const { data: balance } = useQuery({
    queryKey: ['balance', selectedExchange],
    queryFn: () => fetchBalance(selectedExchange),
    refetchInterval: false,
  });

  const handlePercentageClick = (percentage: number) => {
    if (balance?.total) {
      const token = selectedSymbol.split('/')[0];
      const tokenBalance = balance.total[token] || 0;
      setAmount((tokenBalance * (percentage / 100)).toString());
    }
  };

  const handleSellAll = async () => {
    if (balance?.total) {
      const token = selectedSymbol.split('/')[0];
      const tokenBalance = balance.total[token];
      if (tokenBalance && tokenBalance > 0) {
        setAmount(tokenBalance.toString());
        await handleTrade('sell');
      } else {
        toast({
          title: "No balance",
          description: `You don't have any ${token} to sell`,
          variant: "destructive",
        });
      }
    }
  };

  const handleTrade = async (side: 'buy' | 'sell') => {
    if (!amount || isNaN(parseFloat(amount))) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid trading amount",
        variant: "destructive",
      });
      return;
    }

    if (orderType === 'limit' && (!price || isNaN(parseFloat(price)))) {
      toast({
        title: "Invalid price",
        description: "Please enter a valid limit price",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const order = await createOrder(
        selectedExchange,
        selectedSymbol,
        orderType as 'market' | 'limit',
        side,
        parseFloat(amount),
        orderType === 'limit' ? parseFloat(price) : undefined
      );

      if (order) {
        toast({
          title: "Trade Executed",
          description: `Successfully ${side} ${amount} of ${selectedSymbol.split('/')[0]} on ${selectedExchange}`,
        });
        setAmount("");
        setPrice("");
      }
    } catch (error) {
      console.error("Trade execution error:", error);
      toast({
        title: "Trade Failed",
        description: error instanceof Error ? error.message : "Failed to execute trade",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6 bg-trading-gray">
      <h2 className="text-lg font-semibold mb-4">Quick Trade</h2>
      <div className="space-y-4">
        <ExchangeSelector
          selectedExchange={selectedExchange}
          onExchangeChange={setSelectedExchange}
        />
        <SymbolSelector
          selectedSymbol={selectedSymbol}
          onSymbolChange={setSelectedSymbol}
          navigateOnChange={false}
        />
        <TradeType
          type={orderType}
          onTypeChange={setOrderType}
          isLoading={isLoading}
        />
        {orderType === 'limit' && (
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Limit Price (USDC)</label>
            <Input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="bg-trading-gray-light border-trading-gray-light"
              placeholder="Enter limit price..."
              disabled={isLoading}
            />
          </div>
        )}
        <TradeAmount
          amount={amount}
          onAmountChange={setAmount}
          isLoading={isLoading}
        />
        <TradePercentage
          onPercentageClick={handlePercentageClick}
          isLoading={isLoading}
        />
        <div className="grid grid-cols-3 gap-2">
          <Button
            className="w-full bg-trading-green hover:bg-trading-green/90"
            onClick={() => handleTrade('buy')}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Buy'
            )}
          </Button>
          <Button
            className="w-full bg-trading-red hover:bg-trading-red/90"
            onClick={() => handleTrade('sell')}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Sell'
            )}
          </Button>
          <Button
            variant="outline"
            className="w-full border-trading-red text-trading-red hover:bg-trading-red/10"
            onClick={handleSellAll}
            disabled={isLoading}
          >
            Sell All
          </Button>
        </div>
      </div>
    </Card>
  );
}