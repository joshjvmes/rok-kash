interface ArbitrageMetricsProps {
  spread: number;
  potential: number;
}

export function ArbitrageMetrics({ spread, potential }: ArbitrageMetricsProps) {
  return (
    <div className="flex items-center gap-4">
      <div>
        <p className="text-sm text-gray-400">Spread</p>
        <p className="text-trading-green font-semibold">{spread}%</p>
      </div>
      <div>
        <p className="text-sm text-gray-400">Potential</p>
        <p className="text-trading-green font-semibold">${potential}</p>
      </div>
    </div>
  );
}