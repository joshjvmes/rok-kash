import { Card } from "@/components/ui/card";
import { OkxAccountInfo } from "@/components/OkxAccountInfo";
import { TradingHistory } from "@/components/TradingHistory";
import { TradingPairsTable } from "@/components/okx/TradingPairsTable";
import { useOkxTradingPairs } from "@/hooks/useOkxTradingPairs";
import { MarketStructure } from "@/components/MarketStructure";
import { OkxTradeWidget } from "@/components/okx/OkxTradeWidget";
import { OrderBook } from "@/components/OrderBook";

export default function OkxTest() {
  const { pairs, isLoading, selectedPair, setSelectedPair } = useOkxTradingPairs();

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold mb-4">OKX API Testing</h1>
      
      <div className="space-y-6">
        <OkxAccountInfo />

        {selectedPair && (
          <>
            <MarketStructure exchange="okx" symbol={selectedPair} />
            <TradingHistory exchange="okx" symbol={selectedPair} />
            
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
            <OrderBook exchange="okx" symbol={selectedPair} />
            <OkxTradeWidget />
          </>
        )}
      </div>
    </div>
  );
}