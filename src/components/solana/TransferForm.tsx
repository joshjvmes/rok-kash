import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TokenSelector } from './TokenSelector';
import { TransferDirectionSelector } from './TransferDirectionSelector';
import { ExchangeSelector, EXCHANGES } from './ExchangeSelector';
import { DepositAddressDisplay } from './DepositAddressDisplay';

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
  const [isFetchingAddress, setIsFetchingAddress] = useState(false);
  const [depositAddress, setDepositAddress] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchAddress = async () => {
      if (!selectedExchange || !fromType || !toType || !tokenMint) {
        setDepositAddress('');
        setError('');
        return;
      }

      setIsFetchingAddress(true);
      setError('');

      try {
        if (fromType === 'wallet' && toType === 'exchange') {
          const { data, error } = await supabase.functions.invoke('solana-transfer', {
            body: { 
              action: 'getDepositAddress', 
              exchange: selectedExchange,
              tokenMint 
            }
          });

          if (error) throw error;
          if (data?.address) {
            setDepositAddress(data.address);
          }
        } else if (fromType === 'exchange' && toType === 'wallet' && publicKey) {
          setDepositAddress(publicKey.toString());
        }
      } catch (err) {
        console.error('Error fetching deposit address:', err);
        setError('Failed to fetch deposit address. Please try again.');
        toast({
          title: "Error",
          description: "Failed to fetch deposit address",
          variant: "destructive",
        });
      } finally {
        setIsFetchingAddress(false);
      }
    };

    fetchAddress();
  }, [selectedExchange, fromType, toType, publicKey, tokenMint, toast]);

  const handleSwapDirection = () => {
    setFromType(fromType === 'wallet' ? 'exchange' : 'wallet');
    setToType(toType === 'wallet' ? 'exchange' : 'wallet');
  };

  const handleSubmit = async () => {
    if (!connected || !publicKey) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your Phantom wallet first",
        variant: "destructive",
      });
      return;
    }

    if (!amount || !tokenMint || !depositAddress || 
        (fromType === 'exchange' && !selectedExchange) || 
        (toType === 'exchange' && !selectedExchange)) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <TransferDirectionSelector
        fromType={fromType}
        toType={toType}
        onFromTypeChange={setFromType}
        onToTypeChange={setToType}
        onSwapDirection={handleSwapDirection}
        isDisabled={isLoading || isFetchingAddress}
      />

      {(fromType === 'exchange' || toType === 'exchange') && (
        <ExchangeSelector
          value={selectedExchange}
          onChange={setSelectedExchange}
        />
      )}

      <TokenSelector
        value={tokenMint}
        onValueChange={setTokenMint}
        isLoading={isLoading || isFetchingAddress}
      />

      <DepositAddressDisplay
        address={depositAddress}
        isLoading={isFetchingAddress}
      />

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Input
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        min="0"
        step="any"
      />

      <Button
        className="w-full"
        onClick={handleSubmit}
        disabled={isLoading || isFetchingAddress || !connected}
      >
        {isLoading ? "Processing..." : "Transfer"}
      </Button>
    </div>
  );
}