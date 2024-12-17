import { useParams } from "react-router-dom";
import { OrderBook } from "@/components/OrderBook";
import { TradingHistory } from "@/components/TradingHistory";
import { ArbitrageOpportunity } from "@/components/ArbitrageOpportunity";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { findArbitrageOpportunities } from "@/utils/exchange";

const TradingView = () => {
  const { symbol } = useParams();
  const navigate = useNavigate();

  const { data: arbitrageOpportunities = [] } = useQuery({
    queryKey: ['arbitrageOpportunities', symbol],
    queryFn: () => findArbitrageOpportunities(symbol || 'BTC/USDC'),
  });

  if (!symbol) {
    return <div>Invalid trading pair</div>;
  }

  return (
    <div className="min-h-screen bg-rokcat-purple-darker">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/')}
            className="gap-2 border-rokcat-purple hover:border-rokcat-purple-light hover:bg-rokcat-purple/10"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-rokcat-purple to-rokcat-purple-light bg-clip-text text-transparent">
            {symbol} Trading View
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <OrderBook exchange="coinbase" symbol={symbol} />
            <TradingHistory exchange="coinbase" symbol={symbol} />
          </div>
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-rokcat-purple-light">Arbitrage Opportunities</h2>
            {arbitrageOpportunities.map((opportunity, index) => (
              <ArbitrageOpportunity key={index} {...opportunity} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingView;