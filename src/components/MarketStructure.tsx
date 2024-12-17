import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { fetchMarketStructure } from "@/utils/exchanges/ccxt";
import { Loader2 } from "lucide-react";

interface MarketStructureProps {
  symbol: string;
  exchange: string;
}

export function MarketStructure({ symbol, exchange }: MarketStructureProps) {
  const { data: marketInfo, isLoading } = useQuery({
    queryKey: ['marketStructure', exchange, symbol],
    queryFn: () => fetchMarketStructure(exchange, symbol),
  });

  if (isLoading) {
    return (
      <Card className="p-4 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </Card>
    );
  }

  if (!marketInfo) {
    return null;
  }

  return (
    <Card className="p-4 bg-trading-gray">
      <h3 className="text-sm font-semibold mb-2">Market Structure - {exchange}</h3>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-400">Min Order Size</p>
          <p className="font-medium">{marketInfo.limits?.amount?.min || 'N/A'} {symbol.split('/')[0]}</p>
        </div>
        <div>
          <p className="text-gray-400">Max Order Size</p>
          <p className="font-medium">{marketInfo.limits?.amount?.max || 'N/A'} {symbol.split('/')[0]}</p>
        </div>
        <div>
          <p className="text-gray-400">Price Precision</p>
          <p className="font-medium">{marketInfo.precision?.price || 'N/A'} decimals</p>
        </div>
        <div>
          <p className="text-gray-400">Amount Precision</p>
          <p className="font-medium">{marketInfo.precision?.amount || 'N/A'} decimals</p>
        </div>
        <div>
          <p className="text-gray-400">Min Notional</p>
          <p className="font-medium">${marketInfo.limits?.cost?.min || 'N/A'}</p>
        </div>
        <div>
          <p className="text-gray-400">Maker Fee</p>
          <p className="font-medium">{(marketInfo.maker * 100).toFixed(3)}%</p>
        </div>
        <div>
          <p className="text-gray-400">Taker Fee</p>
          <p className="font-medium">{(marketInfo.taker * 100).toFixed(3)}%</p>
        </div>
      </div>
    </Card>
  );
}