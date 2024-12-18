import { Card } from "@/components/ui/card";
import { useState } from "react";
import { createOrder } from "@/utils/exchanges/ccxt";
import { useToast } from "@/hooks/use-toast";
import { MarketStructure } from "./MarketStructure";
import { ArbitrageHeader } from "./arbitrage/ArbitrageHeader";
import { ArbitrageMetrics } from "./arbitrage/ArbitrageMetrics";
import { ArbitrageExecuteButton } from "./arbitrage/ArbitrageExecuteButton";
import { ArbitrageExpandButton } from "./arbitrage/ArbitrageExpandButton";

interface ArbitrageOpportunityProps {
  buyExchange: string;
  sellExchange: string;
  symbol: string;
  spread: number;
  potential: number;
}

export function ArbitrageOpportunity({
  buyExchange,
  sellExchange,
  symbol,
  spread,
  potential,
}: ArbitrageOpportunityProps) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();

  const handleExecute = async () => {
    setIsExecuting(true);
    try {
      // Execute buy order on buyExchange
      const buyOrder = await createOrder(
        buyExchange.toLowerCase(),
        symbol,
        "market",
        "buy",
        1000 // Default amount for demo
      );

      if (buyOrder) {
        toast({
          title: "Buy Order Executed",
          description: `Successfully bought on ${buyExchange}`,
        });

        // Execute sell order on sellExchange
        const sellOrder = await createOrder(
          sellExchange.toLowerCase(),
          symbol,
          "market",
          "sell",
          1000 // Default amount for demo
        );

        if (sellOrder) {
          toast({
            title: "Arbitrage Complete",
            description: `Successfully executed arbitrage between ${buyExchange} and ${sellExchange}`,
          });
        }
      }
    } catch (error) {
      console.error("Arbitrage execution error:", error);
      toast({
        title: "Arbitrage Failed",
        description: error instanceof Error ? error.message : "Failed to execute arbitrage",
        variant: "destructive",
      });
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="space-y-2">
      <Card className="p-4 bg-trading-gray hover:bg-trading-gray-light transition-colors">
        <div className="flex items-center justify-between">
          <ArbitrageHeader
            buyExchange={buyExchange}
            sellExchange={sellExchange}
            symbol={symbol}
          />
          <div className="flex items-center gap-4">
            <ArbitrageMetrics spread={spread} potential={potential} />
            <ArbitrageExecuteButton
              isExecuting={isExecuting}
              onExecute={handleExecute}
            />
            <ArbitrageExpandButton
              isExpanded={isExpanded}
              onToggle={() => setIsExpanded(!isExpanded)}
            />
          </div>
        </div>
      </Card>
      {isExpanded && (
        <div className="grid grid-cols-2 gap-4">
          <MarketStructure exchange={buyExchange} symbol={symbol} />
          <MarketStructure exchange={sellExchange} symbol={symbol} />
        </div>
      )}
    </div>
  );
}