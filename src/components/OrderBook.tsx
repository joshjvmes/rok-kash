import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { fetchOrderBook } from "@/utils/exchanges/ccxt";
import { ScrollArea } from "@/components/ui/scroll-area";

interface OrderBookProps {
  exchange: string;
  symbol: string;
}

export function OrderBook({ exchange, symbol }: OrderBookProps) {
  const { data: orderBook, isLoading } = useQuery({
    queryKey: ['orderBook', exchange, symbol],
    queryFn: () => fetchOrderBook(exchange, symbol),
    refetchInterval: false, // Disable auto-refresh
  });

  if (isLoading) {
    return (
      <Card className="p-4 bg-trading-gray">
        <p className="text-sm text-gray-400">Loading order book...</p>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-trading-gray">
      <h3 className="text-lg font-semibold mb-4">Order Book - {symbol}</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm text-gray-400 mb-2">Bids</h4>
          <ScrollArea className="h-[200px]">
            <div className="space-y-1">
              {orderBook?.bids?.slice(0, 10).map(([price, amount]) => (
                <div key={price} className="flex justify-between text-sm">
                  <span className="text-trading-green">${Number(price).toFixed(2)}</span>
                  <span>{Number(amount).toFixed(4)}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
        <div>
          <h4 className="text-sm text-gray-400 mb-2">Asks</h4>
          <ScrollArea className="h-[200px]">
            <div className="space-y-1">
              {orderBook?.asks?.slice(0, 10).map(([price, amount]) => (
                <div key={price} className="flex justify-between text-sm">
                  <span className="text-trading-red">${Number(price).toFixed(2)}</span>
                  <span>{Number(amount).toFixed(4)}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </Card>
  );
}