import { QuickTrade } from "@/components/QuickTrade";
import { OrderBook } from "@/components/OrderBook";
import { TradingHistory } from "@/components/TradingHistory";

interface TradingSectionProps {
  selectedSymbol: string;
}

export function TradingSection({ selectedSymbol }: TradingSectionProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-6">
        <QuickTrade />
        <ExchangeBalanceGrid exchanges={['coinbase', 'kraken', 'bybit']} />
      </div>
      <div className="space-y-6">
        <OrderBook exchange="coinbase" symbol={selectedSymbol} />
        <TradingHistory exchange="coinbase" symbol={selectedSymbol} />
      </div>
    </div>
  );
}