interface PriceEstimationProps {
  estimatedPrice: number | null;
  estimatedReceiveAmount: string;
  selectedPair: string;
}

export function PriceEstimation({ estimatedPrice, estimatedReceiveAmount, selectedPair }: PriceEstimationProps) {
  if (!estimatedPrice) return null;

  return (
    <div className="space-y-2 mt-4">
      <div className="text-sm text-gray-500">
        Current Price for {selectedPair}: ${estimatedPrice.toFixed(8)}
      </div>
      {estimatedReceiveAmount && (
        <div className="text-sm text-gray-500">
          Estimated Value: ${estimatedReceiveAmount}
        </div>
      )}
    </div>
  );
}