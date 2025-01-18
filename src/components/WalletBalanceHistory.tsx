import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Skeleton } from "./ui/skeleton";
import { format } from "date-fns";

interface WalletBalance {
  token_mint: string;
  balance: number;
  last_updated: string;
  wallet_address: string;
}

const TOKEN_SYMBOLS: Record<string, string> = {
  'So11111111111111111111111111111111111111112': 'SOL',
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'USDC',
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 'USDT',
};

export function WalletBalanceHistory() {
  const { data: balances, isLoading } = useQuery({
    queryKey: ['wallet-balances'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('solana_wallet_balances')
        .select('*')
        .order('last_updated', { ascending: false });
      
      if (error) throw error;
      return data as WalletBalance[];
    },
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Wallet Balance History</h2>
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">Wallet Balance History</h2>
      <ScrollArea className="h-[400px]">
        <div className="space-y-4">
          {balances?.map((balance, index) => (
            <div
              key={`${balance.wallet_address}-${balance.token_mint}-${index}`}
              className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">
                    {TOKEN_SYMBOLS[balance.token_mint] || balance.token_mint}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {balance.wallet_address.slice(0, 4)}...{balance.wallet_address.slice(-4)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{balance.balance.toFixed(6)}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(balance.last_updated), 'MMM d, yyyy HH:mm')}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}