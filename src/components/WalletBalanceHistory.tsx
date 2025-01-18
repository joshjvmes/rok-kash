import { useEffect, useState } from 'react';
import { Card } from './ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from './ui/skeleton';
import { useToast } from '@/hooks/use-toast';

interface WalletBalance {
  wallet_address: string;
  token_mint: string;
  balance: number;
  last_updated: string;
}

export const WalletBalanceHistory = () => {
  const [balances, setBalances] = useState<WalletBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchBalances = async () => {
      try {
        const { data, error } = await supabase
          .from('solana_wallet_balances')
          .select('*')
          .order('last_updated', { ascending: false });

        if (error) throw error;

        setBalances(data || []);
      } catch (error) {
        console.error('Error fetching balance history:', error);
        toast({
          title: "Error",
          description: "Failed to load balance history",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalances();
  }, [toast]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const formatTokenSymbol = (mint: string) => {
    switch (mint) {
      case 'So11111111111111111111111111111111111111112':
        return 'SOL';
      case 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v':
        return 'USDC';
      case 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB':
        return 'USDT';
      default:
        return mint.slice(0, 4) + '...' + mint.slice(-4);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">Balance History</h2>
      {balances.map((balance, index) => (
        <Card key={index} className="p-4 bg-white/50 backdrop-blur-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Wallet</p>
              <p className="font-mono text-sm">
                {balance.wallet_address.slice(0, 4)}...{balance.wallet_address.slice(-4)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Token</p>
              <p className="font-medium">{formatTokenSymbol(balance.token_mint)}</p>
            </div>
          </div>
          <div className="mt-2 flex justify-between items-end">
            <div>
              <p className="text-sm text-gray-500">Balance</p>
              <p className="text-lg font-bold">{balance.balance.toFixed(4)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">
                {new Date(balance.last_updated).toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};