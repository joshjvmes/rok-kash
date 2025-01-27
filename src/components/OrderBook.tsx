import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { fetchOrderBook } from "@/utils/exchanges/ccxt";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LiquidityMonitor } from "./LiquidityMonitor";

interface OrderBookProps {
  exchange: string;
  symbol: string;
}

export function OrderBook({ exchange, symbol }: OrderBookProps) {
  const { data: orderBook, isLoading } = useQuery({
    queryKey: ['orderBook', exchange, symbol],
    queryFn: () => fetchOrderBook(exchange, symbol),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <Card className="p-4 bg-serenity-white bg-opacity-90">
        <p className="text-sm text-serenity-mountain">Loading order book...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <LiquidityMonitor exchange={exchange} symbol={symbol} />
      
      <Card className="p-4 bg-serenity-white bg-opacity-90">
        <h3 className="text-lg font-semibold mb-4 text-serenity-mountain">Order Book - {symbol}</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm text-serenity-mountain mb-2">Bids</h4>
            <ScrollArea className="h-[200px]">
              <div className="space-y-1">
                {orderBook?.bids?.slice(0, 10).map(([price, amount]) => (
                  <div key={price} className="flex justify-between text-sm">
                    <span className="text-serenity-grass-light">${Number(price).toFixed(2)}</span>
                    <span className="text-serenity-mountain">{Number(amount).toFixed(4)}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
          <div>
            <h4 className="text-sm text-serenity-mountain mb-2">Asks</h4>
            <ScrollArea className="h-[200px]">
              <div className="space-y-1">
                {orderBook?.asks?.slice(0, 10).map(([price, amount]) => (
                  <div key={price} className="flex justify-between text-sm">
                    <span className="text-serenity-grass">${Number(price).toFixed(2)}</span>
                    <span className="text-serenity-mountain">{Number(amount).toFixed(4)}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </Card>
    </div>
  );
}