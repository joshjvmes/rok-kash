import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { fetchTrades } from "@/utils/exchanges/ccxt";

interface TradingHistoryProps {
  exchange: string;
  symbol: string;
}

export function TradingHistory({ exchange, symbol }: TradingHistoryProps) {
  const { data: trades = [], isLoading } = useQuery({
    queryKey: ['trades', exchange, symbol],
    queryFn: () => fetchTrades(exchange, symbol),
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  if (isLoading) {
    return (
      <Card className="p-4 bg-trading-gray">
        <p className="text-sm text-gray-400">Loading trading history...</p>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-trading-gray">
      <h3 className="text-lg font-semibold mb-4">Recent Trades - {symbol}</h3>
      <ScrollArea className="h-[300px]">
        <div className="space-y-2">
          {trades.slice(0, 20).map((trade: any) => (
            <div
              key={trade.id || `${trade.timestamp}-${trade.price}`}
              className="flex justify-between text-sm border-b border-gray-700 pb-2"
            >
              <span className={trade.side === 'buy' ? 'text-trading-green' : 'text-trading-red'}>
                {trade.side.toUpperCase()}
              </span>
              <span>${Number(trade.price).toFixed(2)}</span>
              <span>{Number(trade.amount).toFixed(4)}</span>
              <span className="text-gray-400">
                {new Date(trade.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}