import { Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
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

interface SymbolSelectorProps {
  selectedSymbol: string;
  onSymbolChange: (value: string) => void;
  navigateOnChange?: boolean;
}

export function SymbolSelector({ 
  selectedSymbol, 
  onSymbolChange,
  navigateOnChange = false 
}: SymbolSelectorProps) {
  const navigate = useNavigate();
  const estimatedTimes = {
    "BTC/USDC": "10-60 minutes",
    "ETH/USDC": "5-10 minutes",
    "SOL/USDC": "< 1 minute",
    "AVAX/USDC": "< 1 minute",
    "ADA/USDC": "5-10 minutes",
    "XRP/USDC": "3-5 seconds",
    "PEPE/USDC": "< 1 minute",
    "SHI/USDC": "< 1 minute",
    "BONK/USDC": "< 1 minute",
    "FLOG/USDC": "< 1 minute",
    "BTTC/USDC": "< 1 minute",
    "MOG/USDC": "< 1 minute",
    // Add Kucoin popular pairs
    "DOGE/USDC": "1-5 minutes",
    "MATIC/USDC": "< 1 minute",
    "DOT/USDC": "2-5 minutes",
    "LINK/USDC": "< 1 minute",
    "UNI/USDC": "< 1 minute",
    "AAVE/USDC": "< 1 minute",
    "ATOM/USDC": "2-5 minutes",
    "FTM/USDC": "< 1 minute"
  };

  const handleSymbolChange = (value: string) => {
    onSymbolChange(value);
    if (navigateOnChange) {
      navigate(`/trading/${encodeURIComponent(value)}`);
    }
  };

  return (
    <div>
      <label className="text-sm text-gray-400 mb-2 block">Symbol</label>
      <div className="flex items-center gap-2">
        <Select
          value={selectedSymbol}
          onValueChange={handleSymbolChange}
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
            <SelectItem value="DOGE/USDC">DOGE/USDC</SelectItem>
            <SelectItem value="MATIC/USDC">MATIC/USDC</SelectItem>
            <SelectItem value="DOT/USDC">DOT/USDC</SelectItem>
            <SelectItem value="LINK/USDC">LINK/USDC</SelectItem>
            <SelectItem value="UNI/USDC">UNI/USDC</SelectItem>
            <SelectItem value="AAVE/USDC">AAVE/USDC</SelectItem>
            <SelectItem value="ATOM/USDC">ATOM/USDC</SelectItem>
            <SelectItem value="FTM/USDC">FTM/USDC</SelectItem>
            <SelectItem value="PEPE/USDC">PEPE/USDC</SelectItem>
            <SelectItem value="SHI/USDC">SHI/USDC</SelectItem>
            <SelectItem value="BONK/USDC">BONK/USDC</SelectItem>
            <SelectItem value="FLOG/USDC">FLOG/USDC</SelectItem>
            <SelectItem value="BTTC/USDC">BTTC/USDC</SelectItem>
            <SelectItem value="MOG/USDC">MOG/USDC</SelectItem>
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
  );
}