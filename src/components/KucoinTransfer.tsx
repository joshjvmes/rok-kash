import { useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function KucoinTransfer() {
  const { publicKey } = useWallet();
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('SOL');
  const [operation, setOperation] = useState('deposit');
  const [isLoading, setIsLoading] = useState(false);

  const handleTransfer = useCallback(async () => {
    if (!publicKey) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your Phantom wallet first",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase.functions.invoke('kucoin-transfer', {
        body: {
          operation,
          currency,
          amount: parseFloat(amount),
          address: publicKey.toString(),
        }
      });

      if (error) throw error;

      // Record the transaction
      await supabase.from('wallet_transactions').insert({
        transaction_type: operation,
        from_address: operation === 'withdraw' ? 'kucoin' : publicKey.toString(),
        to_address: operation === 'withdraw' ? publicKey.toString() : 'kucoin',
        amount: parseFloat(amount),
        token_symbol: currency,
      });

      toast({
        title: "Transfer initiated",
        description: operation === 'withdraw' 
          ? "Withdrawal request has been submitted" 
          : "Deposit address has been generated",
      });

      if (operation === 'deposit' && data?.address) {
        toast({
          title: "Deposit Address",
          description: `Send ${currency} to: ${data.address}`,
        });
      }
    } catch (error) {
      console.error('Transfer error:', error);
      toast({
        title: "Transfer failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, operation, currency, amount, toast]);

  return (
    <Card className="p-6 bg-serenity-white shadow-lg border border-serenity-sky-light">
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-serenity-mountain">
          Transfer Crypto
        </h2>

        <div className="space-y-4">
          <div>
            <Label>Operation</Label>
            <Select value={operation} onValueChange={setOperation}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="deposit">Deposit to KuCoin</SelectItem>
                <SelectItem value="withdraw">Withdraw to Phantom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SOL">SOL</SelectItem>
                <SelectItem value="USDC">USDC</SelectItem>
                <SelectItem value="USDT">USDT</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Amount</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              min="0"
              step="any"
            />
          </div>

          <Button 
            onClick={handleTransfer} 
            disabled={!amount || !currency || isLoading}
            className="w-full"
          >
            {isLoading ? "Processing..." : `${operation === 'withdraw' ? 'Withdraw' : 'Deposit'}`}
          </Button>
        </div>
      </div>
    </Card>
  );
}