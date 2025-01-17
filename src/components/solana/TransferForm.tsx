import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowRightLeft } from "lucide-react";

const EXCHANGES = ['binance', 'kraken', 'kucoin', 'okx'];

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
  const [depositAddress, setDepositAddress] = useState<string>('');

  useEffect(() => {
    const fetchAddress = async () => {
      if (!selectedExchange || !fromType || !toType) {
        setDepositAddress('');
        return;
      }

      if (fromType === 'wallet' && toType === 'exchange') {
        try {
          const { data, error } = await supabase.functions.invoke('solana-transfer', {
            body: { action: 'getDepositAddress', exchange: selectedExchange }
          });

          if (error) throw error;
          if (data?.address) {
            setDepositAddress(data.address);
          }
        } catch (error) {
          console.error('Error fetching deposit address:', error);
          toast({
            title: "Error",
            description: "Failed to fetch deposit address",
            variant: "destructive",
          });
        }
      } else if (fromType === 'exchange' && toType === 'wallet' && publicKey) {
        setDepositAddress(publicKey.toString());
      }
    };

    fetchAddress();
  }, [selectedExchange, fromType, toType, publicKey]);

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

    if (!amount || !tokenMint || (fromType === 'exchange' && !selectedExchange) || (toType === 'exchange' && !selectedExchange)) {
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
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Select
            value={fromType}
            onValueChange={(value: 'wallet' | 'exchange') => setFromType(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="From" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="wallet">Phantom Wallet</SelectItem>
              <SelectItem value="exchange">Exchange</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleSwapDirection}
          className="rounded-full"
        >
          <ArrowRightLeft className="h-4 w-4" />
        </Button>

        <div className="flex-1">
          <Select
            value={toType}
            onValueChange={(value: 'wallet' | 'exchange') => setToType(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="To" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="wallet">Phantom Wallet</SelectItem>
              <SelectItem value="exchange">Exchange</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {(fromType === 'exchange' || toType === 'exchange') && (
        <Select
          value={selectedExchange}
          onValueChange={setSelectedExchange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select exchange" />
          </SelectTrigger>
          <SelectContent>
            {EXCHANGES.map((exchange) => (
              <SelectItem key={exchange} value={exchange}>
                {exchange.charAt(0).toUpperCase() + exchange.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Input
        type="text"
        placeholder="Token mint address"
        value={tokenMint}
        onChange={(e) => setTokenMint(e.target.value)}
      />

      <Input
        type="text"
        placeholder="Deposit/Withdrawal address"
        value={depositAddress}
        readOnly
        className="bg-gray-50"
      />

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
        disabled={isLoading || !connected}
      >
        {isLoading ? "Processing..." : "Transfer"}
      </Button>
    </div>
  );
}