import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { getSolanaBalance } from '@/utils/solana';
import { getTokenBalance, getTokenList, TokenInfo, TokenBalance } from '@/utils/solana/tokens';
import { Skeleton } from './ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Card } from './ui/card';

export const PhantomWalletBalances = () => {
  const { connected, publicKey } = useWallet();
  const { toast } = useToast();
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [tokenBalances, setTokenBalances] = useState<Array<TokenBalance & TokenInfo>>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchBalances = async () => {
      if (!connected || !publicKey) return;

      setIsLoading(true);
      try {
        // Get SOL balance
        const balance = await getSolanaBalance(publicKey.toString());
        setSolBalance(balance);

        // Get token list and balances
        const tokens = await getTokenList();
        const balancePromises = tokens.map(async (token) => {
          try {
            const balance = await getTokenBalance(token.address, publicKey.toString());
            return {
              ...token,
              ...balance,
            };
          } catch (error) {
            console.error(`Error fetching balance for token ${token.symbol}:`, error);
            return null;
          }
        });

        const balances = (await Promise.all(balancePromises))
          .filter((balance): balance is TokenBalance & TokenInfo => 
            balance !== null && Number(balance.balance) > 0
          );

        setTokenBalances(balances);
      } catch (error) {
        console.error('Error fetching wallet balances:', error);
        toast({
          title: "Error",
          description: "Failed to fetch wallet balances",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalances();
  }, [connected, publicKey, toast]);

  if (!connected) {
    return null;
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-2">SOL Balance</h3>
        {isLoading ? (
          <Skeleton className="h-6 w-24" />
        ) : (
          <p className="text-xl font-bold">{solBalance?.toFixed(4) || '0'} SOL</p>
        )}
      </Card>

      {tokenBalances.length > 0 && (
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-2">Token Balances</h3>
          <div className="space-y-2">
            {isLoading ? (
              <>
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </>
            ) : (
              tokenBalances.map((token) => (
                <div key={token.address} className="flex items-center justify-between p-2 hover:bg-accent rounded-lg transition-colors">
                  <div className="flex items-center gap-2">
                    {token.logoURI && (
                      <img
                        src={token.logoURI}
                        alt={token.symbol}
                        className="w-6 h-6 rounded-full"
                      />
                    )}
                    <span>{token.symbol}</span>
                  </div>
                  <span className="font-medium">
                    {(Number(token.balance) / Math.pow(10, token.decimals)).toFixed(4)}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      )}
    </div>
  );
};