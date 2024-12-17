import { Card } from "@/components/ui/card";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { createOrder } from "@/utils/exchanges/ccxt";
import { useToast } from "@/hooks/use-toast";

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
    <Card className="p-4 bg-trading-gray hover:bg-trading-gray-light transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">{buyExchange}</span>
            <ArrowRight size={16} className="text-trading-blue" />
            <span className="text-sm text-gray-400">{sellExchange}</span>
          </div>
          <span className="text-sm font-semibold">{symbol}</span>
        </div>
        <div className="flex items-center gap-4">
          <div>
            <p className="text-sm text-gray-400">Spread</p>
            <p className="text-trading-green font-semibold">{spread}%</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Potential</p>
            <p className="text-trading-green font-semibold">${potential}</p>
          </div>
          <Button
            variant="outline"
            className="ml-2"
            onClick={handleExecute}
            disabled={isExecuting}
          >
            {isExecuting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Execute'
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}