import { Card } from "@/components/ui/card";
import { BybitAccountInfo } from "@/components/BybitAccountInfo";
import { TradingHistory } from "@/components/TradingHistory";
import { MarketStructure } from "@/components/MarketStructure";
import { OrderBook } from "@/components/OrderBook";

export default function BybitTest() {
  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Bybit API Testing</h1>
      <div className="space-y-6">
        <BybitAccountInfo />
        <MarketStructure exchange="bybit" symbol="BTC/USDT" />
        <TradingHistory exchange="bybit" symbol="BTC/USDT" />
        <OrderBook exchange="bybit" symbol="BTC/USDT" />
      </div>
    </div>
  );
}