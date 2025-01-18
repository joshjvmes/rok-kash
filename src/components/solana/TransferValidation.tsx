import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

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
  depositAddress,
}: TransferValidationProps) {
  // Only show connection alert if we're dealing with wallet operations
  if ((fromType === 'wallet' || toType === 'wallet') && !connected) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Please connect your Phantom wallet to proceed with the transfer.
        </AlertDescription>
      </Alert>
    );
  }

  if ((fromType === 'exchange' || toType === 'exchange') && !selectedExchange) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Please select an exchange to proceed with the transfer.
        </AlertDescription>
      </Alert>
    );
  }

  if (!tokenMint) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Please select a token to transfer.
        </AlertDescription>
      </Alert>
    );
  }

  if (!amount || parseFloat(amount) <= 0) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Please enter a valid amount to transfer.
        </AlertDescription>
      </Alert>
    );
  }

  if (fromType === 'wallet' && !depositAddress) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Please wait for the deposit address to be generated.
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}