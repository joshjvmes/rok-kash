import { Button } from "@/components/ui/button";

interface TradePercentageProps {
  onPercentageClick: (percentage: number) => void;
  isLoading: boolean;
}

export function TradePercentage({ onPercentageClick, isLoading }: TradePercentageProps) {
  const percentages = [25, 50, 75, 100];

  return (
    <div>
      <label className="text-sm text-gray-400 mb-2 block">Amount (%)</label>
      <div className="grid grid-cols-4 gap-1">
        {percentages.map((percentage) => (
          <Button
            key={percentage}
            variant="outline"
            size="sm"
            onClick={() => onPercentageClick(percentage)}
            disabled={isLoading}
            className="bg-trading-gray-light border-trading-gray-light hover:bg-trading-gray"
          >
            {percentage}%
          </Button>
        ))}
      </div>
    </div>
  );
}