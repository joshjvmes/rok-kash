import { Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchBalance } from "@/utils/exchanges/ccxt";
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
import { Loader2 } from "lucide-react";

interface SymbolSelectorProps {
  selectedSymbol: string;
  onSymbolChange: (value: string) => void;
  fromExchange: string;
}

interface BalanceData {
  total: {
    [key: string]: number;
  };
}

export function SymbolSelector({ 
  selectedSymbol, 
  onSymbolChange,
  fromExchange
}: SymbolSelectorProps) {
  const { data: balance, isLoading } = useQuery<BalanceData>({
    queryKey: ['balance', fromExchange],
    queryFn: () => fetchBalance(fromExchange),
    enabled: !!fromExchange,
  });

  const availableTokens = balance?.total ? 
    Object.entries(balance.total)
      .filter(([_, amount]) => amount > 0)
      .map(([token]) => token)
      .sort() : [];

  const estimatedTimes: { [key: string]: string } = {
    "BTC": "10-60 minutes",
    "ETH": "5-10 minutes",
    "SOL": "< 1 minute",
    "AVAX": "< 1 minute",
    "ADA": "5-10 minutes",
    "XRP": "3-5 seconds",
    "USDT": "1-5 minutes",
    "USDC": "1-5 minutes",
  };

  if (isLoading) {
    return (
      <div>
        <label className="text-sm text-serenity-mountain mb-2 block">Symbol</label>
        <div className="flex items-center gap-2">
          <Select disabled value="">
            <SelectTrigger className="bg-white border-serenity-sky-dark">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading tokens...</span>
              </div>
            </SelectTrigger>
          </Select>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="text-sm text-serenity-mountain mb-2 block">Symbol</label>
      <div className="flex items-center gap-2">
        <Select
          value={selectedSymbol}
          onValueChange={onSymbolChange}
        >
          <SelectTrigger className="bg-white border-serenity-sky-dark flex-1">
            <SelectValue placeholder="Select token" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            {availableTokens.length > 0 ? (
              availableTokens.map((token) => (
                <SelectItem key={token} value={token}>{token}</SelectItem>
              ))
            ) : (
              <SelectItem value="" disabled>No tokens available</SelectItem>
            )}
          </SelectContent>
        </Select>
        {selectedSymbol && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div className="flex items-center text-serenity-mountain">
                  <Clock className="h-4 w-4" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Estimated transfer time: {estimatedTimes[selectedSymbol] || "varies"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
}