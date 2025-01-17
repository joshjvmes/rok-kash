import { Alert, AlertDescription } from "@/components/ui/alert";

interface TransferValidationProps {
  connected: boolean;
  fromType: 'wallet' | 'exchange';
  toType: 'exchange' | 'wallet';
  selectedExchange: string;
  amount: string;
  tokenMint: string;
  depositAddress: string;
}

export function TransferValidation({ 
  connected,
  fromType,
  toType,
  selectedExchange,
  amount,
  tokenMint,
  depositAddress
}: TransferValidationProps) {
  if (!connected) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Please connect your Phantom wallet first</AlertDescription>
      </Alert>
    );
  }

  if (!amount || !tokenMint || !depositAddress || 
      (fromType === 'exchange' && !selectedExchange) || 
      (toType === 'exchange' && !selectedExchange)) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Please fill in all required fields</AlertDescription>
      </Alert>
    );
  }

  return null;
}