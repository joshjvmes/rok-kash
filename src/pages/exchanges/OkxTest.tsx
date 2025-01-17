import { Card } from "@/components/ui/card";
import { OkxAccountInfo } from "@/components/OkxAccountInfo";
import { TradingHistory } from "@/components/TradingHistory";
import { TradingPairsTable } from "@/components/okx/TradingPairsTable";
import { useOkxTradingPairs } from "@/hooks/useOkxTradingPairs";
import { MarketStructure } from "@/components/MarketStructure";
import { OrderBook } from "@/components/OrderBook";
import { OkxTradeWidget } from "@/components/okx/OkxTradeWidget";

export default function OkxTest() {
  const { pairs, isLoading, selectedPair, setSelectedPair } = useOkxTradingPairs();

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold mb-4">OKX API Testing</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <OkxAccountInfo />
          
          {selectedPair && (
            <>
              <MarketStructure exchange="okx" symbol={selectedPair} />
              <TradingHistory exchange="okx" symbol={selectedPair} />
            </>
          )}

          <Card className="p-4">
            <h2 className="text-xl font-semibold mb-4">Available Trading Pairs</h2>
            <TradingPairsTable 
              pairs={pairs}
              isLoading={isLoading}
              onPairSelect={setSelectedPair}
            />
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {selectedPair && (
            <>
              <OrderBook exchange="okx" symbol={selectedPair} />
              <OkxTradeWidget />
            </>
          )}
        </div>
      </div>
    </div>
  );
}