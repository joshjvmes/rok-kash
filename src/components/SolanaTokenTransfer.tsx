import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

const EXCHANGES = ['bybit', 'kraken', 'binance', 'kucoin', 'okx'];

export function SolanaTokenTransfer() {
  const { connected, publicKey } = useWallet();
  const { toast } = useToast();
  const [fromType, setFromType] = useState<'wallet' | 'exchange'>('wallet');
  const [toType, setToType] = useState<'exchange' | 'wallet'>('exchange');
  const [selectedExchange, setSelectedExchange] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [tokenMint, setTokenMint] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSwapDirection = () => {
    setFromType(fromType === 'wallet' ? 'exchange' : 'wallet');
    setToType(toType === 'wallet' ? 'exchange' : 'wallet');
  };

  const handleTransfer = async () => {
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
      // Get the current user's ID
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Record the transfer in the database
      const { error } = await supabase.from('solana_transfers').insert({
        user_id: user.id,
        from_type: fromType,
        to_type: toType,
        from_address: fromType === 'wallet' ? publicKey.toString() : selectedExchange,
        to_address: toType === 'wallet' ? publicKey.toString() : selectedExchange,
        token_mint: tokenMint,
        amount: parseFloat(amount),
      });

      if (error) throw error;

      toast({
        title: "Transfer initiated",
        description: "Your transfer request has been recorded",
      });
    } catch (error) {
      console.error('Transfer error:', error);
      toast({
        title: "Transfer failed",
        description: "There was an error initiating the transfer",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transfer Tokens</CardTitle>
        <CardDescription>Move tokens between your wallet and exchanges</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min="0"
          step="any"
        />

        <Button
          className="w-full"
          onClick={handleTransfer}
          disabled={isLoading || !connected}
        >
          {isLoading ? "Processing..." : "Transfer"}
        </Button>
      </CardContent>
    </Card>
  );
}