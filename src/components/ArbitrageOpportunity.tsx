import { Card } from "@/components/ui/card";
import { ArrowRight, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { createOrder } from "@/utils/exchanges/ccxt";
import { useToast } from "@/hooks/use-toast";
import { MarketStructure } from "./MarketStructure";

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
      <Card className="p-4 bg-[#1F2937] hover:bg-[#2D3748] transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-300">{buyExchange}</span>
              <ArrowRight size={16} className="text-trading-blue" />
              <span className="text-sm text-gray-300">{sellExchange}</span>
            </div>
            <span className="text-sm font-semibold">{symbol}</span>
          </div>
          <div className="flex items-center gap-4">
            <div>
              <p className="text-sm text-gray-300">Spread</p>
              <p className="text-trading-green font-semibold">{spread}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-300">Potential</p>
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
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
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