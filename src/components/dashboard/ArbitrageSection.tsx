import { ArbitrageOpportunity } from "@/components/ArbitrageOpportunity";

interface ArbitrageSectionProps {
  opportunities: any[];
}

export function ArbitrageSection({ opportunities }: ArbitrageSectionProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-rokcat-purple-light">
        Arbitrage Opportunities
      </h2>
      {opportunities.map((opportunity, index) => (
        <ArbitrageOpportunity key={index} {...opportunity} />
      ))}
    </div>
  );
}