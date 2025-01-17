import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { connection } from '@/utils/solana';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';

export function useSolanaTokens(tokenMint: string) {
  const { publicKey } = useWallet();
  const [balance, setBalance] = useState<string>('0');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!publicKey || !tokenMint) return;

      setIsLoading(true);
      try {
        console.log('Fetching token accounts for:', publicKey.toString());
        
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
          publicKey,
          {
            programId: TOKEN_PROGRAM_ID,
          }
        );

        const tokenAccount = tokenAccounts.value.find(
          (account) => account.account.data.parsed.info.mint === tokenMint
        );

        if (tokenAccount) {
          console.log('Found token account:', tokenAccount);
          const parsedInfo = tokenAccount.account.data.parsed.info;
          setBalance(parsedInfo.tokenAmount.amount);
        } else {
          console.log('No token account found for mint:', tokenMint);
          setBalance('0');
        }
      } catch (error) {
        console.error('Error fetching token balance:', error);
        setBalance('0');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalance();
  }, [publicKey, tokenMint]);

  return { balance, isLoading };
}