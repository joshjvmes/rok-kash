import { Card } from "@/components/ui/card";
import { BinanceAccountInfo } from "@/components/BinanceAccountInfo";
import { TradingHistory } from "@/components/TradingHistory";
import { MarketStructure } from "@/components/MarketStructure";
import { OrderBook } from "@/components/OrderBook";
import { BinanceTradeWidget } from "@/components/binance/BinanceTradeWidget";
import { useState } from "react";

export default function BinanceTest() {
  const [selectedSymbol, setSelectedSymbol] = useState("BTC/USDT");

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Binance API Testing</h1>
      
      <div className="space-y-6">
        <BinanceAccountInfo />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <MarketStructure exchange="binance" symbol={selectedSymbol} />
            <TradingHistory exchange="binance" symbol={selectedSymbol} />
          </div>
          
          <div className="space-y-6">
            <OrderBook exchange="binance" symbol={selectedSymbol} />
          </div>
        </div>

        <BinanceTradeWidget />
      </div>
    </div>
  );
}