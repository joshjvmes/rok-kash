import { Card } from "@/components/ui/card";
import { useState } from "react";
import { createOrder, fetchBalance } from "@/utils/exchanges/ccxt";
import { useToast } from "@/hooks/use-toast";
import { ExchangeSelector } from "./trading/ExchangeSelector";
import { SymbolSelector } from "./trading/SymbolSelector";
import { TradeAmount } from "./trading/TradeAmount";
import { TradeType } from "./trading/TradeType";
import { TradePercentage } from "./trading/TradePercentage";
import { LimitPriceInput } from "./trading/LimitPriceInput";
import { TradeActions } from "./trading/TradeActions";
import { useQuery } from "@tanstack/react-query";

export function QuickTrade() {
  const [amount, setAmount] = useState("");
  const [price, setPrice] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedExchange, setSelectedExchange] = useState("bybit");
  const [selectedSymbol, setSelectedSymbol] = useState("BTC/USDC");
  const [orderType, setOrderType] = useState("market");
  const { toast } = useToast();

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
          fromExchange={selectedExchange}
        />
        <TradeType
          type={orderType}
          onTypeChange={setOrderType}
          isLoading={isLoading}
        />
        {orderType === 'limit' && (
          <LimitPriceInput
            price={price}
            onPriceChange={setPrice}
            isLoading={isLoading}
          />
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
        <TradeActions
          onBuy={() => handleTrade('buy')}
          onSell={() => handleTrade('sell')}
          onSellAll={handleSellAll}
          isLoading={isLoading}
        />
      </div>
    </Card>
  );
}