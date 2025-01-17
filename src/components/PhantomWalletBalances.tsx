import { useEffect, useState } from 'react';
import { useWeb3React } from '@web3-react/core';
import { Connection, PublicKey } from '@solana/web3.js';
import { getSolanaBalance } from '@/utils/solana';
import { getTokenBalance, getTokenList, TokenInfo, TokenBalance } from '@/utils/solana/tokens';
import { Skeleton } from './ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Card } from './ui/card';

export const PhantomWalletBalances = () => {
  const { active, account } = useWeb3React();
  const { toast } = useToast();
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [tokenBalances, setTokenBalances] = useState<Array<TokenBalance & TokenInfo>>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchBalances = async () => {
      if (!active || !account) {
        console.log('Wallet not connected or no account available');
        return;
      }

      console.log('Fetching balances for account:', account);
      setIsLoading(true);
      
      try {
        // Get SOL balance
        console.log('Fetching SOL balance...');
        const balance = await getSolanaBalance(account);
        console.info('SOL balance fetched successfully:', balance);
        setSolBalance(balance);

        // Get token list and balances
        console.log('Fetching token list...');
        const tokens = await getTokenList();
        console.info('Retrieved token list:', tokens.length, 'tokens');
        
        const balancePromises = tokens.map(async (token) => {
          try {
            console.log(`Fetching balance for token ${token.symbol} (${token.address})...`);
            const balance = await getTokenBalance(token.address, account);
            console.info(`Balance for ${token.symbol}:`, balance);
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

        console.info('Final token balances:', balances);
        setTokenBalances(balances);
      } catch (error) {
        console.error('Error fetching wallet balances:', error);
        toast({
          title: "Error",
          description: "Failed to fetch wallet balances. Please try reconnecting your wallet.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (active && account) {
      console.log('Wallet connected, initiating balance fetch...');
      fetchBalances();
    } else {
      setSolBalance(null);
      setTokenBalances([]);
      if (!active) {
        console.log('Wallet disconnected, balances reset');
      }
    }
  }, [active, account, toast]);

  if (!active) {
    return null;
  }

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-white/50 backdrop-blur-sm">
        <h3 className="text-lg font-semibold mb-2">SOL Balance</h3>
        {isLoading ? (
          <Skeleton className="h-6 w-24" />
        ) : (
          <p className="text-xl font-bold">{solBalance?.toFixed(4) || '0'} SOL</p>
        )}
      </Card>

      {tokenBalances.length > 0 && (
        <Card className="p-4 bg-white/50 backdrop-blur-sm">
          <h3 className="text-lg font-semibold mb-2">Token Balances</h3>
          <div className="space-y-2">
            {isLoading ? (
              <>
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </>
            ) : (
              tokenBalances.map((token) => (
                <div key={token.address} className="flex items-center justify-between p-2 hover:bg-white/30 rounded-lg transition-colors">
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