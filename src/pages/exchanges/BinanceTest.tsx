import { Card } from "@/components/ui/card";
import { BinanceAccountInfo } from "@/components/BinanceAccountInfo";
import { TradingHistory } from "@/components/TradingHistory";
import { TradingPairsTable } from "@/components/binance/TradingPairsTable";
import { useBinanceTradingPairs } from "@/hooks/useBinanceTradingPairs";
import { MarketStructure } from "@/components/MarketStructure";
import { BinanceTradeWidget } from "@/components/binance/BinanceTradeWidget";
import { OrderBook } from "@/components/OrderBook";

export default function BinanceTest() {
  const { pairs, isLoading, selectedPair, setSelectedPair } = useBinanceTradingPairs();

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Binance API Testing</h1>
      
      <div className="space-y-6">
        <BinanceAccountInfo />

        {selectedPair && (
          <>
            <MarketStructure exchange="binance" symbol={selectedPair} />
            <TradingHistory exchange="binance" symbol={selectedPair} />
            
            <Card className="p-4">
              <h2 className="text-xl font-semibold mb-4">Available Trading Pairs</h2>
              <TradingPairsTable 
                pairs={pairs}
                isLoading={isLoading}
                onPairSelect={setSelectedPair}
              />
            </Card>
          </>
        )}

        {!selectedPair && (
          <Card className="p-4">
            <h2 className="text-xl font-semibold mb-4">Available Trading Pairs</h2>
            <TradingPairsTable 
              pairs={pairs}
              isLoading={isLoading}
              onPairSelect={setSelectedPair}
            />
          </Card>
        )}

        {selectedPair && (
          <>
            <OrderBook exchange="binance" symbol={selectedPair} />
            <BinanceTradeWidget />
          </>
        )}
      </div>
    </div>
  );
}