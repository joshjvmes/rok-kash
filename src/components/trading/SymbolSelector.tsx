import { Clock } from "lucide-react";
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
  availableSymbols?: string[];
  isLoading?: boolean;
}

export function SymbolSelector({ 
  selectedSymbol, 
  onSymbolChange,
  availableSymbols = [],
  isLoading = false
}: SymbolSelectorProps) {
  const estimatedTimes: { [key: string]: string } = {
    "BTC/USDC": "10-60 minutes",
    "ETH/USDC": "5-10 minutes",
    "SOL/USDC": "< 1 minute",
    "AVAX/USDC": "< 1 minute",
    "ADA/USDC": "5-10 minutes",
    "XRP/USDC": "3-5 seconds",
    "DOGE/USDC": "1-5 minutes",
    "MATIC/USDC": "< 1 minute",
    "DOT/USDC": "2-5 minutes",
    "LINK/USDC": "< 1 minute",
    "UNI/USDC": "< 1 minute",
    "AAVE/USDC": "< 1 minute",
    "ATOM/USDC": "2-5 minutes",
    "FTM/USDC": "< 1 minute"
  };

  return (
    <div>
      <label className="text-sm text-serenity-mountain mb-2 block">Symbol</label>
      <div className="flex items-center gap-2">
        <Select
          value={selectedSymbol || undefined}
          onValueChange={onSymbolChange}
        >
          <SelectTrigger className="bg-white border-serenity-sky-dark flex-1">
            <SelectValue placeholder={isLoading ? "Loading symbols..." : "Select symbol"} />
          </SelectTrigger>
          <SelectContent className="bg-white">
            {isLoading ? (
              <div className="flex items-center justify-center p-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="ml-2">Loading available symbols...</span>
              </div>
            ) : availableSymbols.length > 0 ? (
              availableSymbols.map((symbol) => (
                <SelectItem key={symbol} value={symbol}>
                  {symbol}
                </SelectItem>
              ))
            ) : (
              <div className="p-2 text-sm text-gray-500">
                No tokens available for transfer
              </div>
            )}
          </SelectContent>
        </Select>
        {selectedSymbol && estimatedTimes[selectedSymbol] && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div className="flex items-center text-serenity-mountain">
                  <Clock className="h-4 w-4" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Estimated transaction time: {estimatedTimes[selectedSymbol]}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
}