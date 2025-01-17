import { useWallet } from '@solana/wallet-adapter-react';
import { useEffect, useState } from 'react';
import { getSolanaBalance } from '@/utils/solana';
import { getTokenBalance } from '@/utils/solana/tokens';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface AvailableBalanceProps {
  tokenMint: string;
  onBalanceClick: (balance: string) => void;
}

export function AvailableBalance({ tokenMint, onBalanceClick }: AvailableBalanceProps) {
  const { connected, publicKey } = useWallet();
  const [balance, setBalance] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!connected || !publicKey || !tokenMint) return;

      setIsLoading(true);
      try {
        if (tokenMint === 'So11111111111111111111111111111111111111112') {
          // SOL balance
          const solBalance = await getSolanaBalance(publicKey.toString());
          setBalance(solBalance.toString());
        } else {
          // SPL token balance
          const tokenBalance = await getTokenBalance(tokenMint, publicKey.toString());
          const adjustedBalance = (Number(tokenBalance.balance) / Math.pow(10, tokenBalance.decimals)).toString();
          setBalance(adjustedBalance);
        }
      } catch (error) {
        console.error('Error fetching balance:', error);
        setBalance(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalance();
  }, [connected, publicKey, tokenMint]);

  if (!connected || !tokenMint) return null;

  return (
    <div className="mt-2 text-sm text-muted-foreground">
      {isLoading ? (
        <Skeleton className="h-4 w-24" />
      ) : balance ? (
        <Button 
          variant="link" 
          className="p-0 h-auto font-normal"
          onClick={() => onBalanceClick(balance)}
        >
          Available: {balance}
        </Button>
      ) : (
        <span>Error loading balance</span>
      )}
    </div>
  );
}