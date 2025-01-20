import { Card } from "@/components/ui/card";
import { ArbitrageOpportunity as ArbitrageOpportunityComponent } from "@/components/ArbitrageOpportunity";
import type { ArbitrageOpportunity } from "@/utils/types/exchange";
import { useEffect, useState } from "react";

interface OpportunitiesListProps {
  opportunities: ArbitrageOpportunity[];
  isLoading: boolean;
  timeframeMinutes?: number; // Optional prop to customize the timeframe
}

export function OpportunitiesList({ 
  opportunities, 
  isLoading, 
  timeframeMinutes = 5 // Default 5 minutes
}: OpportunitiesListProps) {
  const [filteredOpportunities, setFilteredOpportunities] = useState<ArbitrageOpportunity[]>(opportunities);

  useEffect(() => {
    // Filter out opportunities older than the specified timeframe
    const filterOldOpportunities = () => {
      const cutoffTime = new Date(Date.now() - timeframeMinutes * 60 * 1000);
      const filtered = opportunities.filter(opp => {
        const oppTime = new Date(opp.timestamp || Date.now());
        return oppTime > cutoffTime;
      });
      setFilteredOpportunities(filtered);
    };

    // Initial filter
    filterOldOpportunities();

    // Set up interval to periodically filter opportunities
    const interval = setInterval(filterOldOpportunities, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [opportunities, timeframeMinutes]);

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Live Opportunities</h2>
          <span className="text-sm text-gray-500">
            Showing opportunities from last {timeframeMinutes} minutes
          </span>
        </div>
        {isLoading ? (
          <p>Loading opportunities...</p>
        ) : filteredOpportunities.length > 0 ? (
          filteredOpportunities.map((opportunity, index) => (
            <ArbitrageOpportunityComponent
              key={`${opportunity.buyExchange}-${opportunity.sellExchange}-${opportunity.symbol}-${index}`}
              {...opportunity}
            />
          ))
        ) : (
          <p>No arbitrage opportunities found</p>
        )}
      </div>
    </Card>
  );
}