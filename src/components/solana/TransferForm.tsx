import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TokenSelector } from './TokenSelector';
import { TransferDirectionSelector } from './TransferDirectionSelector';
import { ExchangeSelector } from './ExchangeSelector';
import { DepositAddressDisplay } from './DepositAddressDisplay';
import { AvailableBalance } from './AvailableBalance';

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

      console.log(`Fetching deposit address for transfer:`, {
        fromType,
        toType,
        exchange: selectedExchange,
        tokenMint
      });

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
            console.info(`Successfully retrieved deposit address: ${data.address}`);
            setDepositAddress(data.address);
          }
        } else if (fromType === 'exchange' && toType === 'wallet' && publicKey) {
          console.info(`Using wallet address as deposit address: ${publicKey.toString()}`);
          setDepositAddress(publicKey.toString());
        }
      } catch (err) {
        const errorMessage = 'Failed to fetch deposit address. Please try again.';
        console.error('Error fetching deposit address:', err);
        setError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsFetchingAddress(false);
      }
    };

    fetchAddress();
  }, [selectedExchange, fromType, toType, publicKey, tokenMint, toast]);

  const handleSwapDirection = () => {
    console.log(`Swapping transfer direction from ${fromType} to ${toType === 'wallet' ? 'exchange' : 'wallet'}`);
    setFromType(fromType === 'wallet' ? 'exchange' : 'wallet');
    setToType(toType === 'wallet' ? 'exchange' : 'wallet');
  };

  const handleSubmit = async () => {
    if (!connected || !publicKey) {
      const message = "Please connect your Phantom wallet first";
      console.error(message);
      toast({
        title: "Wallet not connected",
        description: message,
        variant: "destructive",
      });
      return;
    }

    if (!amount || !tokenMint || !depositAddress || 
        (fromType === 'exchange' && !selectedExchange) || 
        (toType === 'exchange' && !selectedExchange)) {
      const message = "Please fill in all required fields";
      console.error('Transfer validation failed:', message);
      toast({
        title: "Missing information",
        description: message,
        variant: "destructive",
      });
      return;
    }

    console.log(`Initiating transfer:`, {
      fromType,
      toType,
      selectedExchange,
      amount,
      tokenMint,
      depositAddress
    });

    setIsLoading(true);
    try {
      await onTransferSubmit({
        fromType,
        toType,
        selectedExchange,
        amount,
        tokenMint,
      });
      console.info('Transfer submitted successfully');
    } catch (error) {
      console.error('Transfer submission failed:', error);
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

      {fromType === 'wallet' && (
        <AvailableBalance
          tokenMint={tokenMint}
          onBalanceClick={setAmount}
        />
      )}

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