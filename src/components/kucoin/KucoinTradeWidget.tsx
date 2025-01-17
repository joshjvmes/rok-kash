import { Card } from "@/components/ui/card";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { TradingPairSelector } from "./TradingPairSelector";
import { TradeAmountInput } from "./TradeAmountInput";
import { TradeButtons } from "./TradeButtons";
import { useKucoinTrade } from "@/hooks/useKucoinTrade";
import { TradeLogViewer } from "./TradeLogViewer";
import { ActiveOrderDisplay } from "./ActiveOrderDisplay";

export function KucoinTradeWidget() {
  const [amount, setAmount] = useState("");
  const [selectedPair, setSelectedPair] = useState("BTC/USDC");
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);
  
  const {
    balanceData,
    tradeLogs,
    activeOrder,
    isLoading,
    handleTrade,
    handleCancelOrder,
  } = useKucoinTrade(selectedPair);

  // Calculate estimated receive amount
  const estimatedReceiveAmount = estimatedPrice && amount 
    ? (parseFloat(amount) * estimatedPrice).toFixed(2)
    : "0.00";

  if (!balanceData) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="ml-2">Loading balances...</span>
        </div>
      </Card>
    );
  }

  const nonZeroBalances = Object.entries(balanceData.total)
    .filter(([_, amount]) => typeof amount === 'number' && amount > 0)
    .reduce((acc, [coin, amount]) => {
      acc[coin] = amount;
      return acc;
    }, {} as { [key: string]: number });

  const availablePairs = Object.keys(nonZeroBalances).flatMap(baseAsset => {
    const quoteAssets = ['USDT', 'USDC', 'BTC', 'ETH'];
    return quoteAssets
      .filter(quoteAsset => baseAsset !== quoteAsset)
      .map(quoteAsset => ({
        baseAsset,
        quoteAsset,
        symbol: `${baseAsset}/${quoteAsset}`
      }));
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">KuCoin Trade</h2>
        
        <div className="space-y-4">
          <TradingPairSelector
            availablePairs={availablePairs}
            selectedPair={selectedPair}
            onPairSelect={setSelectedPair}
          />

          <TradeAmountInput
            amount={amount}
            onAmountChange={setAmount}
            estimatedPrice={estimatedPrice}
            estimatedReceiveAmount={estimatedReceiveAmount}
          />

          <TradeButtons
            onBuy={() => handleTrade('buy', amount)}
            onSell={() => handleTrade('sell', amount)}
            isLoading={isLoading}
          />

          <ActiveOrderDisplay
            activeOrder={activeOrder}
            onCancel={handleCancelOrder}
          />
        </div>
      </Card>

      <TradeLogViewer logs={tradeLogs} />
    </div>
  );
}