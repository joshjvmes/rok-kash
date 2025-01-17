import { Card } from "@/components/ui/card";
import { KucoinAccountInfo } from "@/components/KucoinAccountInfo";
import { TradingHistory } from "@/components/TradingHistory";
import { TradingPairsTable } from "@/components/kucoin/TradingPairsTable";
import { useKucoinTradingPairs } from "@/hooks/useKucoinTradingPairs";
import { MarketStructure } from "@/components/MarketStructure";
import { KucoinTradeWidget } from "@/components/kucoin/KucoinTradeWidget";
import { OrderBook } from "@/components/OrderBook";

export default function KucoinTest() {
  const { pairs, isLoading, selectedPair, setSelectedPair } = useKucoinTradingPairs();

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Kucoin API Testing</h1>
      
      <div className="space-y-6">
        <KucoinAccountInfo />

        {selectedPair && (
          <>
            <MarketStructure exchange="kucoin" symbol={selectedPair} />
            <TradingHistory exchange="kucoin" symbol={selectedPair} />
            
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
            <OrderBook exchange="kucoin" symbol={selectedPair} />
            <KucoinTradeWidget />
          </>
        )}
      </div>
    </div>
  );
}