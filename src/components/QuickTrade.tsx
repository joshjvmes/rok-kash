import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { createOrder } from "@/utils/exchanges/ccxt";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Clock } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function QuickTrade() {
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedExchange, setSelectedExchange] = useState("bybit");
  const [selectedSymbol, setSelectedSymbol] = useState("BTC/USDC");
  const { toast } = useToast();

  const estimatedTimes = {
    "BTC/USDC": "10-60 minutes",
    "ETH/USDC": "5-10 minutes",
    "SOL/USDC": "< 1 minute",
    "AVAX/USDC": "< 1 minute",
    "ADA/USDC": "5-10 minutes",
    "XRP/USDC": "3-5 seconds"
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
        <div>
          <label className="text-sm text-gray-400 mb-2 block">Exchange</label>
          <Select
            value={selectedExchange}
            onValueChange={setSelectedExchange}
          >
            <SelectTrigger className="bg-trading-gray-light border-trading-gray-light">
              <SelectValue placeholder="Select exchange" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bybit">Bybit</SelectItem>
              <SelectItem value="coinbase">Coinbase</SelectItem>
              <SelectItem value="kraken">Kraken</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm text-gray-400 mb-2 block">Symbol</label>
          <div className="flex items-center gap-2">
            <Select
              value={selectedSymbol}
              onValueChange={setSelectedSymbol}
            >
              <SelectTrigger className="bg-trading-gray-light border-trading-gray-light flex-1">
                <SelectValue placeholder="Select symbol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BTC/USDC">BTC/USDC</SelectItem>
                <SelectItem value="ETH/USDC">ETH/USDC</SelectItem>
                <SelectItem value="SOL/USDC">SOL/USDC</SelectItem>
                <SelectItem value="AVAX/USDC">AVAX/USDC</SelectItem>
                <SelectItem value="ADA/USDC">ADA/USDC</SelectItem>
                <SelectItem value="XRP/USDC">XRP/USDC</SelectItem>
              </SelectContent>
            </Select>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <div className="flex items-center text-gray-400">
                    <Clock className="h-4 w-4" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Estimated transaction time: {estimatedTimes[selectedSymbol]}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <div>
          <label className="text-sm text-gray-400 mb-2 block">Amount (USDC)</label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="bg-trading-gray-light border-trading-gray-light"
            placeholder="Enter amount..."
            disabled={isLoading}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            className="w-full bg-trading-green hover:bg-trading-green/90"
            onClick={() => handleTrade('buy')}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Buy'
            )}
          </Button>
          <Button
            className="w-full bg-trading-red hover:bg-trading-red/90"
            onClick={() => handleTrade('sell')}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Sell'
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}