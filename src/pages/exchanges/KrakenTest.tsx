import { Card } from "@/components/ui/card";
import { KrakenAccountInfo } from "@/components/KrakenAccountInfo";
import { TradingHistory } from "@/components/TradingHistory";
import { MarketStructure } from "@/components/MarketStructure";
import { OrderBook } from "@/components/OrderBook";

export default function KrakenTest() {
  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Kraken API Testing</h1>
      <div className="space-y-6">
        <KrakenAccountInfo />
        <MarketStructure exchange="kraken" symbol="BTC/USDT" />
        <TradingHistory exchange="kraken" symbol="BTC/USDT" />
        <OrderBook exchange="kraken" symbol="BTC/USDT" />
      </div>
    </div>
  );
}