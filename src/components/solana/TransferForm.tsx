import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TokenSelector } from './TokenSelector';
import { TransferDirectionSelector } from './TransferDirectionSelector';
import { ExchangeSelector } from './ExchangeSelector';
import { DepositAddressDisplay } from './DepositAddressDisplay';
import { TransferValidation } from './TransferValidation';
import { useSolanaTokens } from '@/hooks/useSolanaTokens';

interface TransferFormProps {
  onTransferSubmit: (transferData: {
    fromType: 'wallet' | 'exchange';
    toType: 'exchange' | 'wallet';
    selectedExchange: string;
    amount: string;
    tokenMint: string;
  }) => Promise<void>;
}

export function TransferForm({ onTransferSubmit }: TransferFormProps) {
  const { connected, publicKey } = useWallet();
  const { toast } = useToast();
  const [fromType, setFromType] = useState<'wallet' | 'exchange'>('wallet');
  const [toType, setToType] = useState<'exchange' | 'wallet'>('exchange');
  const [selectedExchange, setSelectedExchange] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [tokenMint, setTokenMint] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const { balance } = useSolanaTokens(tokenMint);

  const handleSwapDirection = () => {
    const newFromType = toType;
    const newToType = fromType;
    setFromType(newFromType);
    setToType(newToType);
  };

  const handleSubmit = async () => {
    if ((fromType === 'wallet' || toType === 'wallet') && !connected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your Phantom wallet to proceed.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await onTransferSubmit({
        fromType,
        toType,
        selectedExchange,
        amount,
        tokenMint,
      });
    } catch (error) {
      console.error('Transfer submission failed:', error);
      toast({
        title: "Transfer failed",
        description: error.message || "An error occurred during transfer",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show address when a token and exchange are selected
  const shouldShowAddress = Boolean(
    tokenMint && (
      (fromType === 'wallet' && toType === 'exchange' && selectedExchange) ||
      (fromType === 'exchange' && toType === 'wallet' && connected)
    )
  );

  return (
    <div className="space-y-4">
      <TransferDirectionSelector
        fromType={fromType}
        toType={toType}
        onFromTypeChange={setFromType}
        onToTypeChange={setToType}
        onSwapDirection={handleSwapDirection}
        isDisabled={isLoading}
      />

      {(fromType === 'exchange' || toType === 'exchange') && (
        <ExchangeSelector
          value={selectedExchange}
          onChange={setSelectedExchange}
          disabled={isLoading}
        />
      )}

      <TokenSelector
        value={tokenMint}
        onValueChange={setTokenMint}
        isLoading={isLoading}
      />

      {fromType === 'wallet' && balance && (
        <div className="text-sm text-gray-500">
          Available balance: {balance}
        </div>
      )}

      <DepositAddressDisplay
        exchange={selectedExchange}
        tokenMint={tokenMint}
        show={shouldShowAddress}
        fromType={fromType}
        toType={toType}
        walletAddress={publicKey?.toString()}
      />

      <TransferValidation
        connected={connected}
        fromType={fromType}
        toType={toType}
        selectedExchange={selectedExchange}
        amount={amount}
        tokenMint={tokenMint}
        depositAddress={publicKey?.toString() || ''}
      />

      <Input
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        min="0"
        step="any"
        disabled={isLoading}
      />

      <Button
        className="w-full"
        onClick={handleSubmit}
        disabled={isLoading || ((fromType === 'wallet' || toType === 'wallet') && !connected)}
      >
        {isLoading ? "Processing..." : "Transfer"}
      </Button>
    </div>
  );
}