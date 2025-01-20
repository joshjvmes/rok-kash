import { Card } from "@/components/ui/card";
import { ArrowRight, Loader2, ChevronDown, ChevronUp, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { createOrder } from "@/utils/exchanges/ccxt";
import { useToast } from "@/hooks/use-toast";
import { MarketStructure } from "./MarketStructure";
import { calculateArbitrageProfitability } from "@/utils/exchanges/profitCalculator";
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
  buyPrice: number;
  sellPrice: number;
  amount?: number;
}

export function ArbitrageOpportunity({
  buyExchange,
  sellExchange,
  symbol,
  spread,
  potential,
  buyPrice,
  sellPrice,
  amount = 1000, // Default trading amount
}: ArbitrageOpportunityProps) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [profitDetails, setProfitDetails] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadProfitDetails = async () => {
      try {
        const details = await calculateArbitrageProfitability(
          buyPrice,
          sellPrice,
          amount,
          buyExchange,
          sellExchange
        );
        setProfitDetails(details);
      } catch (error) {
        console.error('Error calculating profit details:', error);
      }
    };

    loadProfitDetails();
  }, [buyPrice, sellPrice, amount, buyExchange, sellExchange]);

  const handleExecute = async () => {
    setIsExecuting(true);
    try {
      // Execute buy order on buyExchange
      const buyOrder = await createOrder(
        buyExchange.toLowerCase(),
        symbol,
        "market",
        "buy",
        amount
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
          amount
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
            <div className="flex items-center gap-1">
              <div>
                <p className="text-sm text-gray-600">Net Profit</p>
                <p className={`font-semibold ${profitDetails?.isViable ? 'text-trading-green' : 'text-trading-red'}`}>
                  ${profitDetails?.details.netProfit.toFixed(2) || '0.00'}
                </p>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info size={16} className="text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-1">
                      <p>Gross Profit: ${profitDetails?.details.grossProfit.toFixed(2)}</p>
                      <p>Buy Fees: ${profitDetails?.details.buyFees.toFixed(2)}</p>
                      <p>Sell Fees: ${profitDetails?.details.sellFees.toFixed(2)}</p>
                      <p>Transfer Fees: ${profitDetails?.details.transferFees.toFixed(2)}</p>
                      <p>Slippage Cost: ${profitDetails?.details.slippageCost.toFixed(2)}</p>
                      <p>Time to Execute: ~{profitDetails?.details.timeToExecute}min</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Button
              variant="outline"
              className="ml-2"
              onClick={handleExecute}
              disabled={isExecuting || !profitDetails?.isViable}
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