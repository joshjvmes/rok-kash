import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { getSolanaBalance } from '@/utils/solana';
import { getTokenBalance } from '@/utils/solana/tokens';
import { Skeleton } from './ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Card } from './ui/card';

// Define the tokens we want to display
const DISPLAY_TOKENS = [
  {
    symbol: 'USDC',
    address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    decimals: 6,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png'
  },
  {
    symbol: 'USDT',
    address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    decimals: 6,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.png'
  }
];

interface TokenBalance {
  symbol: string;
  balance: string;
  decimals: number;
  logoURI?: string;
}

export const PhantomWalletBalances = () => {
  const { connected, publicKey, connecting } = useWallet();
  const { toast } = useToast();
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchBalances = async () => {
      if (!connected || !publicKey) {
        console.log('Wallet not connected or no public key available');
        setSolBalance(null);
        setTokenBalances([]);
        return;
      }

      setIsLoading(true);
      try {
        // Fetch SOL balance
        console.log('Fetching SOL balance for address:', publicKey.toString());
        const balance = await getSolanaBalance(publicKey.toString());
        console.log('SOL balance:', balance);
        setSolBalance(balance);

        // Fetch token balances
        const balancePromises = DISPLAY_TOKENS.map(async (token) => {
          try {
            console.log(`Fetching balance for ${token.symbol} (${token.address})...`);
            const tokenBalance = await getTokenBalance(token.address, publicKey.toString());
            console.log(`${token.symbol} balance:`, tokenBalance);
            return {
              symbol: token.symbol,
              balance: tokenBalance.balance,
              decimals: token.decimals,
              logoURI: token.logoURI
            };
          } catch (error) {
            console.error(`Error fetching ${token.symbol} balance:`, error);
            return {
              symbol: token.symbol,
              balance: '0',
              decimals: token.decimals,
              logoURI: token.logoURI
            };
          }
        });

        const balances = await Promise.all(balancePromises);
        console.log('All token balances:', balances);
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

    // Reset balances when disconnected
    if (!connected) {
      setSolBalance(null);
      setTokenBalances([]);
      setIsLoading(false);
    } else {
      fetchBalances();
    }
  }, [connected, publicKey, toast]);

  // Don't render anything while connecting
  if (connecting) {
    return (
      <div className="space-y-4">
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-2">Connecting Wallet...</h3>
          <Skeleton className="h-6 w-24" />
        </Card>
      </div>
    );
  }

  // Don't render if not connected
  if (!connected) {
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
              <div key={token.symbol} className="flex items-center justify-between p-2 hover:bg-white/30 rounded-lg transition-colors">
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
    </div>
  );
};