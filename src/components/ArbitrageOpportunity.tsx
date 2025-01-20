import { Card } from "@/components/ui/card";
import { ArrowRight, Loader2, ChevronDown, ChevronUp, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { createOrder } from "@/utils/exchanges/ccxt";
import { useToast } from "@/hooks/use-toast";
import { MarketStructure } from "./MarketStructure";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ArbitrageOpportunityProps {
  buyExchange: string;
  sellExchange: string;
  symbol: string;
  spread: number;
  potential: number;
}

interface ArbitrageCalculation {
  grossProfit: number;
  netProfit: number;
  executionTimeMs: number;
  costs: {
    buyExchangeFees: number;
    sellExchangeFees: number;
    transferFees: number;
    slippageCost: number;
    marketImpactCost: number;
  };
  metrics: {
    expectedSlippage: number;
    estimatedExecutionTime: number;
    liquidityScore: number;
    riskScore: number;
    confidenceScore: number;
  };
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

  const { data: calculation, isLoading: isCalculating } = useQuery<ArbitrageCalculation>({
    queryKey: ['arbitrage-calculation', buyExchange, sellExchange, symbol, potential],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('calculate-arbitrage', {
        body: {
          buyExchange,
          sellExchange,
          symbol,
          amount: 1000, // Default amount for calculation
          buyPrice: potential / (1 + spread / 100),
          sellPrice: potential / (1 + spread / 100) * (1 + spread / 100)
        }
      });

      if (error) throw error;
      return data;
    }
  });

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
      <Card className="p-4 bg-[#F1F0FB] hover:bg-[#E5DEFF] transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">{buyExchange}</span>
              <ArrowRight size={16} className="text-trading-blue" />
              <span className="text-sm text-gray-600">{sellExchange}</span>
            </div>
            <span className="text-sm font-semibold text-gray-800">{symbol}</span>
          </div>
          <div className="flex items-center gap-4">
            <div>
              <p className="text-sm text-gray-600">Spread</p>
              <p className="text-trading-green font-semibold">{spread}%</p>
            </div>
            <div className="relative">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <p className="text-sm text-gray-600">Potential</p>
                      <div className="flex items-center gap-1">
                        <p className="text-trading-green font-semibold">${potential}</p>
                        <Info size={14} className="text-gray-400" />
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="w-64 p-2">
                    {isCalculating ? (
                      <p className="text-sm">Calculating details...</p>
                    ) : calculation ? (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Gross Profit:</span>
                          <span>${calculation.grossProfit.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Net Profit:</span>
                          <span>${calculation.netProfit.toFixed(2)}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          <p>Costs Breakdown:</p>
                          <div className="pl-2">
                            <p>Buy Exchange Fee: ${calculation.costs.buyExchangeFees.toFixed(2)}</p>
                            <p>Sell Exchange Fee: ${calculation.costs.sellExchangeFees.toFixed(2)}</p>
                            <p>Transfer Fee: ${calculation.costs.transferFees.toFixed(2)}</p>
                            <p>Slippage: ${calculation.costs.slippageCost.toFixed(2)}</p>
                            <p>Market Impact: ${calculation.costs.marketImpactCost.toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          <p>Metrics:</p>
                          <div className="pl-2">
                            <p>Execution Time: {(calculation.metrics.estimatedExecutionTime / 1000).toFixed(1)}s</p>
                            <p>Confidence Score: {calculation.metrics.confidenceScore.toFixed(0)}%</p>
                            <p>Risk Score: {calculation.metrics.riskScore.toFixed(0)}%</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm">Error calculating details</p>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
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