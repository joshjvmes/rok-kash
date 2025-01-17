import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { fetchTrades } from "@/utils/exchanges/ccxt";

interface TradingHistoryProps {
  exchange: string;
  symbol: string;
}

export function TradingHistory({ exchange, symbol }: TradingHistoryProps) {
  const { data: trades = [], isLoading, error } = useQuery({
    queryKey: ['trades', exchange, symbol],
    queryFn: () => fetchTrades(exchange, symbol),
    refetchInterval: false, // Disable auto-refresh
  });

  if (isLoading) {
    return (
      <Card className="p-4 bg-rokcat-purple-darker border-rokcat-purple/20">
        <p className="text-sm text-rokcat-purple-light">Loading trading history...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-4 bg-rokcat-purple-darker border-rokcat-purple/20">
        <p className="text-sm text-trading-red">Error loading trades</p>
      </Card>
    );
  }

  const validTrades = Array.isArray(trades) ? trades : [];

  return (
    <Card className="p-4 bg-rokcat-purple-darker border-rokcat-purple/20">
      <h3 className="text-lg font-semibold mb-4 text-rokcat-purple-light">{symbol} Recent Trades</h3>
      <ScrollArea className="h-[300px] pr-4">
        <div className="space-y-2">
          {validTrades.slice(0, 20).map((trade: any) => (
            <div
              key={trade.id || `${trade.timestamp}-${trade.price}`}
              className="flex justify-between text-sm border-b border-rokcat-purple/20 pb-2 hover:bg-rokcat-purple-darker/50 rounded-sm px-2 py-1 transition-colors"
            >
              <span className={trade.side === 'buy' ? 'text-trading-green font-medium' : 'text-trading-red font-medium'}>
                {trade.side.toUpperCase()}
              </span>
              <span className="text-rokcat-purple-light">${Number(trade.price).toFixed(2)}</span>
              <span className="text-rokcat-purple-light">{Number(trade.amount).toFixed(4)}</span>
              <span className="text-rokcat-gray">
                {new Date(trade.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
          {validTrades.length === 0 && (
            <p className="text-sm text-rokcat-gray text-center py-4">No trades available</p>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}