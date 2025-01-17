import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { fetchOrderBook } from "@/utils/exchanges/ccxt";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LiquidityMonitorProps {
  exchange: string;
  symbol: string;
}

interface LiquidityMetrics {
  bidLiquidity: number;
  askLiquidity: number;
  bidAskRatio: number;
  spreadPercentage: number;
}

export function LiquidityMonitor({ exchange, symbol }: LiquidityMonitorProps) {
  const { data: orderBook, isLoading } = useQuery({
    queryKey: ['orderBook', exchange, symbol],
    queryFn: () => fetchOrderBook(exchange, symbol),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const calculateLiquidityMetrics = (orderBook: any): LiquidityMetrics => {
    if (!orderBook?.bids?.length || !orderBook?.asks?.length) {
      return {
        bidLiquidity: 0,
        askLiquidity: 0,
        bidAskRatio: 0,
        spreadPercentage: 0
      };
    }

    // Calculate total liquidity within 2% of mid price
    const midPrice = (orderBook.bids[0][0] + orderBook.asks[0][0]) / 2;
    const priceRange = midPrice * 0.02; // 2% range

    const bidLiquidity = orderBook.bids
      .filter(([price]: number[]) => price >= midPrice - priceRange)
      .reduce((sum: number, [price, amount]: number[]) => sum + (price * amount), 0);

    const askLiquidity = orderBook.asks
      .filter(([price]: number[]) => price <= midPrice + priceRange)
      .reduce((sum: number, [price, amount]: number[]) => sum + (price * amount), 0);

    const spreadPercentage = ((orderBook.asks[0][0] - orderBook.bids[0][0]) / midPrice) * 100;

    return {
      bidLiquidity,
      askLiquidity,
      bidAskRatio: bidLiquidity / (askLiquidity || 1),
      spreadPercentage
    };
  };

  if (isLoading) {
    return (
      <Card className="p-4 bg-trading-gray">
        <p className="text-sm text-gray-400">Loading liquidity data...</p>
      </Card>
    );
  }

  const metrics = calculateLiquidityMetrics(orderBook);

  return (
    <Card className="p-4 bg-trading-gray">
      <h3 className="text-lg font-semibold mb-4">Liquidity Analysis - {symbol}</h3>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-black/10 rounded">
            <p className="text-sm text-gray-400">Bid Liquidity (USD)</p>
            <p className="text-lg font-semibold">${metrics.bidLiquidity.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
          </div>
          <div className="p-3 bg-black/10 rounded">
            <p className="text-sm text-gray-400">Ask Liquidity (USD)</p>
            <p className="text-lg font-semibold">${metrics.askLiquidity.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-black/10 rounded">
            <p className="text-sm text-gray-400">Bid/Ask Ratio</p>
            <p className="text-lg font-semibold">{metrics.bidAskRatio.toFixed(3)}</p>
          </div>
          <div className="p-3 bg-black/10 rounded">
            <p className="text-sm text-gray-400">Spread</p>
            <p className="text-lg font-semibold">{metrics.spreadPercentage.toFixed(3)}%</p>
          </div>
        </div>
      </div>
    </Card>
  );
}