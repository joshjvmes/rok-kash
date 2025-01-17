import { ArbitrageOpportunity } from "@/components/ArbitrageOpportunity";
import { ArbitrageSettings } from "@/components/trading/ArbitrageSettings";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { findArbitrageOpportunities } from "@/utils/exchanges/arbitrage";
import type { ArbitrageOpportunity as ArbitrageOpportunityType } from "@/utils/types/exchange";

export default function PureArbitrage() {
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunityType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        const opportunities = await findArbitrageOpportunities("BTC/USDT");
        setOpportunities(opportunities);
      } catch (error) {
        console.error("Error fetching arbitrage opportunities:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOpportunities();
    // Refresh every 30 seconds
    const interval = setInterval(fetchOpportunities, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Pure Arbitrage</h1>
        <ArbitrageSettings />
      </div>
      <Card className="p-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Live Opportunities</h2>
          {isLoading ? (
            <p>Loading opportunities...</p>
          ) : opportunities.length > 0 ? (
            opportunities.map((opportunity) => (
              <ArbitrageOpportunity
                key={`${opportunity.buyExchange}-${opportunity.sellExchange}-${opportunity.symbol}`}
                {...opportunity}
              />
            ))
          ) : (
            <p>No arbitrage opportunities found</p>
          )}
        </div>
      </Card>
    </div>
  );
}