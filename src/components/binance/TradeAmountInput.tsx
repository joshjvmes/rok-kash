import { Input } from "@/components/ui/input";

interface TradeAmountInputProps {
  amount: string;
  onAmountChange: (value: string) => void;
  estimatedPrice: number | null;
  estimatedReceiveAmount: string;
}

export function TradeAmountInput({ 
  amount, 
  onAmountChange, 
  estimatedPrice, 
  estimatedReceiveAmount 
}: TradeAmountInputProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm text-gray-500 mb-2 block">Amount</label>
        <Input
          type="number"
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
          placeholder="Enter amount..."
        />
      </div>

      {estimatedPrice && (
        <div className="space-y-2">
          <div className="text-sm text-gray-500">
            Current Price: ${estimatedPrice.toFixed(8)}
          </div>
          {amount && (
            <div className="text-sm text-gray-500">
              Estimated Value: ${estimatedReceiveAmount}
            </div>
          )}
        </div>
      )}
    </div>
  );
}