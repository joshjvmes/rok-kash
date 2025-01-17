import { Card } from "@/components/ui/card";
import { ArbitrageOpportunity as ArbitrageOpportunityComponent } from "@/components/ArbitrageOpportunity";
import type { ArbitrageOpportunity } from "@/utils/types/exchange";

interface OpportunitiesListProps {
  opportunities: ArbitrageOpportunity[];
  isLoading: boolean;
}

export function OpportunitiesList({ opportunities, isLoading }: OpportunitiesListProps) {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold mb-4">Live Opportunities</h2>
        {isLoading ? (
          <p>Loading opportunities...</p>
        ) : opportunities.length > 0 ? (
          opportunities.map((opportunity) => (
            <ArbitrageOpportunityComponent
              key={`${opportunity.buyExchange}-${opportunity.sellExchange}-${opportunity.symbol}`}
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