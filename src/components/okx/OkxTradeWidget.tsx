import { Card } from "@/components/ui/card";
import { TradeType } from "@/components/trading/TradeType";
import { TradeAmount } from "@/components/trading/TradeAmount";
import { TradeActions } from "@/components/trading/TradeActions";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { createOrder } from "@/utils/exchanges/ccxt";

export function OkxTradeWidget() {
  const [type, setType] = useState("market");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleBuy = async () => {
    if (!amount) {
      toast({
        title: "Error",
        description: "Please enter an amount",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await createOrder("okx", "BTC/USDT", type as "market" | "limit", "buy", Number(amount));
      toast({
        title: "Success",
        description: "Buy order placed successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to place buy order",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSell = async () => {
    if (!amount) {
      toast({
        title: "Error",
        description: "Please enter an amount",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await createOrder("okx", "BTC/USDT", type as "market" | "limit", "sell", Number(amount));
      toast({
        title: "Success",
        description: "Sell order placed successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to place sell order",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSellAll = async () => {
    setIsLoading(true);
    try {
      // Implementation for sell all functionality
      toast({
        title: "Success",
        description: "Sell all order placed successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to place sell all order",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6 space-y-6 bg-serenity-white">
      <h3 className="text-lg font-semibold text-serenity-mountain">Trade</h3>
      <div className="space-y-4">
        <TradeType
          type={type}
          onTypeChange={setType}
          isLoading={isLoading}
        />
        <TradeAmount
          amount={amount}
          onAmountChange={setAmount}
          isLoading={isLoading}
        />
        <TradeActions
          onBuy={handleBuy}
          onSell={handleSell}
          onSellAll={handleSellAll}
          isLoading={isLoading}
        />
      </div>
    </Card>
  );
}