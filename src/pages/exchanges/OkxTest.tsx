import { Card } from "@/components/ui/card";
import { OkxAccountInfo } from "@/components/OkxAccountInfo";
import { TradingHistory } from "@/components/TradingHistory";
import { MarketStructure } from "@/components/MarketStructure";
import { OrderBook } from "@/components/OrderBook";

export default function OkxTest() {
  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold mb-4">OKX API Testing</h1>
      <div className="space-y-6">
        <OkxAccountInfo />
        <MarketStructure exchange="okx" symbol="BTC/USDT" />
        <TradingHistory exchange="okx" symbol="BTC/USDT" />
        <OrderBook exchange="okx" symbol="BTC/USDT" />
      </div>
    </div>
  );
}