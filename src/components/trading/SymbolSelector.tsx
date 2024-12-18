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
    "BTC/USD": "10-60 minutes",
    "ETH/USD": "5-10 minutes",
    "SOL/USD": "< 1 minute",
    "AVAX/USD": "< 1 minute",
    "ADA/USD": "5-10 minutes",
    "XRP/USD": "3-5 seconds",
    "PEPE/USD": "< 1 minute",
    "SHI/USD": "< 1 minute",
    "BONK/USD": "< 1 minute",
    "FLOG/USD": "< 1 minute",
    "BTTC/USD": "< 1 minute",
    "MOG/USD": "< 1 minute"
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
            <SelectItem value="BTC/USD">BTC/USD</SelectItem>
            <SelectItem value="ETH/USD">ETH/USD</SelectItem>
            <SelectItem value="SOL/USD">SOL/USD</SelectItem>
            <SelectItem value="AVAX/USD">AVAX/USD</SelectItem>
            <SelectItem value="ADA/USD">ADA/USD</SelectItem>
            <SelectItem value="XRP/USD">XRP/USD</SelectItem>
            <SelectItem value="PEPE/USD">PEPE/USD</SelectItem>
            <SelectItem value="SHI/USD">SHI/USD</SelectItem>
            <SelectItem value="BONK/USD">BONK/USD</SelectItem>
            <SelectItem value="FLOG/USD">FLOG/USD</SelectItem>
            <SelectItem value="BTTC/USD">BTTC/USD</SelectItem>
            <SelectItem value="MOG/USD">MOG/USD</SelectItem>
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