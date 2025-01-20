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
  buyPrice?: number;
  sellPrice?: number;
}

export function ArbitrageOpportunity({
  buyExchange,
  sellExchange,
  symbol,
  spread,
  potential,
  buyPrice = 0,
  sellPrice = 0,
}: ArbitrageOpportunityProps) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasLoadedDetails, setHasLoadedDetails] = useState(false);
  const { toast } = useToast();

  // Calculate estimated profit with $80,000 investment
  const calculateEstimatedProfit = () => {
    if (!buyPrice || !sellPrice) return 0;
    
    const investment = 80000;
    const quantity = investment / buyPrice;
    
    // Estimated trading fees (0.1% per trade is common)
    const buyFee = investment * 0.001;
    const sellValue = quantity * sellPrice;
    const sellFee = sellValue * 0.001;
    
    // Network/transfer fees (estimated $5 per transfer)
    const transferFees = 5;
    
    const grossProfit = sellValue - investment;
    const totalFees = buyFee + sellFee + transferFees;
    const netProfit = grossProfit - totalFees;
    
    return netProfit;
  };

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

  const handleExpand = () => {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);
    if (newExpandedState && !hasLoadedDetails) {
      setHasLoadedDetails(true);
    }
  };

  const estimatedProfit = calculateEstimatedProfit();

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
              onClick={handleExpand}
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
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-600">{buyExchange} Price</h3>
                <p className="text-lg font-semibold">${buyPrice.toFixed(2)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600">{sellExchange} Price</h3>
                <p className="text-lg font-semibold">${sellPrice.toFixed(2)}</p>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Estimated Profit (with $80,000)</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Trading Fees (0.1%)</span>
                  <span className="text-sm">-${((80000 * 0.001) * 2).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Transfer Fees</span>
                  <span className="text-sm">-$5.00</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Net Profit</span>
                  <span className={estimatedProfit > 0 ? "text-trading-green" : "text-trading-red"}>
                    ${estimatedProfit.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
            
            {hasLoadedDetails && (
              <div className="grid grid-cols-2 gap-4">
                <MarketStructure exchange={buyExchange} symbol={symbol} />
                <MarketStructure exchange={sellExchange} symbol={symbol} />
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}