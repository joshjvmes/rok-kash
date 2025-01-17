import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { fetchTrades } from "@/utils/exchanges/ccxt";

interface TradingHistoryProps {
  exchange: string;
  symbol: string;
}

export function TradingHistory({ exchange, symbol }: TradingHistoryProps) {
  // Query for live trades
  const { data: trades = [], isLoading } = useQuery({
    queryKey: ['trades', exchange, symbol],
    queryFn: async () => {
      const fetchedTrades = await fetchTrades(exchange, symbol);
      return Array.isArray(fetchedTrades) ? fetchedTrades : [];
    },
    refetchInterval: 10000, // Fetch every 10 seconds
  });

  if (isLoading) {
    return (
      <Card className="p-4 bg-serenity-sky-dark/10 border-serenity-sky-light/30">
        <p className="text-sm text-serenity-mountain">Loading trading history...</p>
      </Card>
    );
  }

  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString()
    };
  };

  return (
    <Card className="p-4 bg-serenity-sky-dark/10 border-serenity-sky-light/30 backdrop-blur-sm">
      <h3 className="text-lg font-semibold mb-4 text-serenity-mountain">{symbol} Recent Trades</h3>
      <ScrollArea className="h-[300px] pr-4">
        <div className="space-y-2">
          {trades.map((trade: any) => {
            const { date, time } = formatDateTime(trade.timestamp);
            return (
              <div
                key={trade.id || `${trade.timestamp}-${trade.price}-${trade.amount}`}
                className="flex justify-between text-sm border-b border-serenity-sky-light/20 pb-2 hover:bg-serenity-sky-light/10 rounded-sm px-2 py-1 transition-colors"
              >
                <span className={trade.side === 'buy' ? 'text-serenity-grass-light font-medium' : 'text-trading-red font-medium'}>
                  {trade.side.toUpperCase()}
                </span>
                <span className="text-serenity-mountain">${Number(trade.price).toFixed(2)}</span>
                <span className="text-serenity-mountain">{Number(trade.amount).toFixed(4)}</span>
                <div className="text-serenity-mountain/70 text-right">
                  <div>{date}</div>
                  <div>{time}</div>
                </div>
              </div>
            );
          })}
          {trades.length === 0 && (
            <p className="text-sm text-serenity-mountain/70 text-center py-4">No trades available</p>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}