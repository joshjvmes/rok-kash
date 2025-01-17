import { useState, useEffect } from 'react';
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";

const EXCHANGES = ['binance', 'kraken', 'kucoin', 'okx'];

interface TransferStatus {
  id: string;
  status: string;
  created_at: string;
  from_type: string;
  to_type: string;
  amount: number;
  token_mint: string;
  error_message?: string;
}

export function SolanaTokenTransfer() {
  const { connected, publicKey } = useWallet();
  const { toast } = useToast();
  const [fromType, setFromType] = useState<'wallet' | 'exchange'>('wallet');
  const [toType, setToType] = useState<'exchange' | 'wallet'>('exchange');
  const [selectedExchange, setSelectedExchange] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [tokenMint, setTokenMint] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [depositAddress, setDepositAddress] = useState<string>('');

  // Fetch recent transfers
  const { data: recentTransfers } = useQuery({
    queryKey: ['solana-transfers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('solana_transfers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as TransferStatus[];
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });

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

      // Prepare transfer data
      const transferData = {
        fromType,
        toType,
        fromAddress: fromType === 'wallet' ? publicKey.toString() : selectedExchange,
        toAddress: toType === 'wallet' ? publicKey.toString() : selectedExchange,
        tokenMint,
        amount: parseFloat(amount),
      };

      // Call the transfer edge function
      const { data, error: functionError } = await supabase.functions.invoke('solana-transfer', {
        body: transferData
      });

      if (functionError) throw functionError;

      // Record the transfer in the database
      const { error: dbError } = await supabase.from('solana_transfers').insert({
        user_id: user.id,
        from_type: fromType,
        to_type: toType,
        from_address: transferData.fromAddress,
        to_address: transferData.toAddress,
        token_mint: tokenMint,
        amount: parseFloat(amount),
        status: data.status,
      });

      if (dbError) throw dbError;

      toast({
        title: "Transfer initiated",
        description: data.message || "Your transfer request has been recorded",
      });
    } catch (error) {
      console.error('Transfer error:', error);
      toast({
        title: "Transfer failed",
        description: error.message || "There was an error initiating the transfer",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'text-green-500';
      case 'pending':
        return 'text-yellow-500';
      case 'failed':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="space-y-6">
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
            onClick={handleTransfer}
            disabled={isLoading || !connected}
          >
            {isLoading ? "Processing..." : "Transfer"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transfers</CardTitle>
          <CardDescription>Monitor your recent transfer activities</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px] w-full rounded-md">
            <div className="space-y-2">
              {recentTransfers?.map((transfer) => (
                <div
                  key={transfer.id}
                  className="flex items-center justify-between border-b border-gray-100 py-2"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {transfer.from_type} → {transfer.to_type}
                    </p>
                    <p className="text-xs text-gray-500">
                      Amount: {transfer.amount} ({transfer.token_mint.slice(0, 8)}...)
                    </p>
                  </div>
                  <div className={`text-sm font-medium ${getStatusColor(transfer.status)}`}>
                    {transfer.status}
                    {transfer.error_message && (
                      <p className="text-xs text-red-500">{transfer.error_message}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
