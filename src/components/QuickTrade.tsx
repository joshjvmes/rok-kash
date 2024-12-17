import { Card } from "@/components/ui/card";
import { useState } from "react";
import { createOrder } from "@/utils/exchanges/ccxt";
import { useToast } from "@/hooks/use-toast";
import { ExchangeSelector } from "./trading/ExchangeSelector";
import { SymbolSelector } from "./trading/SymbolSelector";
import { TradeAmount } from "./trading/TradeAmount";
import { TradeButtons } from "./trading/TradeButtons";

export function QuickTrade() {
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedExchange, setSelectedExchange] = useState("bybit");
  const [selectedSymbol, setSelectedSymbol] = useState("BTC/USDC");
  const { toast } = useToast();

  const handleTrade = async (side: 'buy' | 'sell') => {
    if (!amount || isNaN(parseFloat(amount))) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid trading amount",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const order = await createOrder(
        selectedExchange,
        selectedSymbol,
        "market",
        side,
        parseFloat(amount)
      );

      if (order) {
        toast({
          title: "Trade Executed",
          description: `Successfully ${side} ${amount} USDC of ${selectedSymbol.split('/')[0]} on ${selectedExchange}`,
        });
        setAmount("");
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
        />
        <TradeAmount
          amount={amount}
          onAmountChange={setAmount}
          isLoading={isLoading}
        />
        <TradeButtons
          onBuy={() => handleTrade('buy')}
          onSell={() => handleTrade('sell')}
          isLoading={isLoading}
        />
      </div>
    </Card>
  );
}