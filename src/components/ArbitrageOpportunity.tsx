import { Card } from "@/components/ui/card";
import { ArrowRight, Loader2, ChevronDown, ChevronUp, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { createOrder } from "@/utils/exchanges/ccxt";
import { useToast } from "@/hooks/use-toast";
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

  // Log the opportunity when the component mounts
  console.info(`Found arbitrage opportunity: ${buyExchange} -> ${sellExchange} | ${symbol} | Spread: ${spread}% | Potential: $${potential}`);

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
      const buyOrder = await createOrder(
        buyExchange.toLowerCase(),
        symbol,
        "market",
        "buy",
        1000
      );

      if (buyOrder) {
        toast({
          title: "Buy Order Executed",
          description: `Successfully bought on ${buyExchange}`,
        });

        const sellOrder = await createOrder(
          sellExchange.toLowerCase(),
          symbol,
          "market",
          "sell",
          1000
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
            <div>
              <p className="text-sm text-gray-600">Potential</p>
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
        <Card className="p-4">
          {isCalculating ? (
            <div className="flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Calculating profit details...</span>
            </div>
          ) : calculation ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold mb-2">Profit Breakdown</h3>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Gross Profit</span>
                      <span className="text-sm font-medium">${calculation.grossProfit.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Costs</span>
                      <span className="text-sm font-medium text-red-500">
                        -${(calculation.grossProfit - calculation.netProfit).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-1">
                      <span className="text-sm font-semibold">Net Profit</span>
                      <span className="text-sm font-semibold text-trading-green">
                        ${calculation.netProfit.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-2">Cost Breakdown</h3>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Buy Exchange Fee</span>
                      <span className="text-sm">${calculation.costs.buyExchangeFees.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Sell Exchange Fee</span>
                      <span className="text-sm">${calculation.costs.sellExchangeFees.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Transfer Fee</span>
                      <span className="text-sm">${calculation.costs.transferFees.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Slippage</span>
                      <span className="text-sm">${calculation.costs.slippageCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Market Impact</span>
                      <span className="text-sm">${calculation.costs.marketImpactCost.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-2">Risk Metrics</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Execution Time</p>
                    <p className="text-sm font-medium">
                      {(calculation.metrics.estimatedExecutionTime / 1000).toFixed(1)}s
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Confidence Score</p>
                    <p className="text-sm font-medium">{calculation.metrics.confidenceScore.toFixed(0)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Risk Score</p>
                    <p className="text-sm font-medium">{calculation.metrics.riskScore.toFixed(0)}%</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-600">Error loading calculation details</p>
          )}
        </Card>
      )}
    </div>
  );
}