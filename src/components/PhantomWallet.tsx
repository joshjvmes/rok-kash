import { FC, useEffect, useMemo } from 'react';
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getTokenBalance } from '@/utils/solana/tokens';
import { getSolanaBalance } from '@/utils/solana';

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';

const TRACKED_TOKENS = [
  {
    symbol: 'USDC',
    address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    decimals: 6
  },
  {
    symbol: 'USDT',
    address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    decimals: 6
  }
];

const WalletConnection: FC = () => {
  const { connected, wallet, connecting, disconnect, publicKey } = useWallet();
  const { toast } = useToast();

  const storeWalletBalances = async () => {
    if (!publicKey) return;

    try {
      // Get SOL balance
      const solBalance = await getSolanaBalance(publicKey.toString());
      
      // Store SOL balance
      await supabase.from('solana_wallet_balances').upsert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        wallet_address: publicKey.toString(),
        token_mint: 'So11111111111111111111111111111111111111112', // Native SOL mint address
        balance: solBalance,
      });

      // Get and store token balances
      for (const token of TRACKED_TOKENS) {
        const tokenBalance = await getTokenBalance(token.address, publicKey.toString());
        await supabase.from('solana_wallet_balances').upsert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          wallet_address: publicKey.toString(),
          token_mint: token.address,
          balance: Number(tokenBalance.balance) / Math.pow(10, token.decimals),
        });
      }

      toast({
        title: "Balances Updated",
        description: "Your wallet balances have been stored successfully",
      });
    } catch (error) {
      console.error('Error storing wallet balances:', error);
      toast({
        title: "Error",
        description: "Failed to store wallet balances",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (connecting) {
      console.info('Wallet connecting...');
      toast({
        title: "Connecting Wallet",
        description: "Please approve the connection in Phantom",
      });
    }
  }, [connecting, toast]);

  useEffect(() => {
    if (connected && wallet && publicKey) {
      console.info('Wallet connected successfully');
      storeWalletBalances();
      toast({
        title: "Wallet Connected",
        description: "Successfully connected to Phantom wallet",
        variant: "default",
      });
    }
  }, [connected, wallet, publicKey]);

  useEffect(() => {
    if (!connected && !connecting && wallet) {
      console.error('Wallet disconnected or connection failed');
      toast({
        title: "Wallet Disconnected",
        description: "Wallet connection was lost or failed",
        variant: "destructive",
      });
    }
  }, [connected, connecting, wallet, toast]);

  return (
    <div className="flex items-center gap-2">
      <WalletMultiButton 
        className="phantom-button"
        style={{
          backgroundColor: connecting ? '#4a5568' : undefined,
          cursor: connecting ? 'not-allowed' : 'pointer',
        }}
      />
      {connected && (
        <Button 
          variant="destructive" 
          onClick={() => {
            disconnect();
            console.info('Successfully disconnected from Phantom wallet');
            toast({
              title: "Wallet Disconnected",
              description: "Successfully disconnected from Phantom wallet",
            });
          }}
          className="h-[48px]"
          disabled={connecting}
        >
          Disconnect
        </Button>
      )}
    </div>
  );
};

export const PhantomWallet: FC = () => {
  const network = WalletAdapterNetwork.Mainnet;
  const endpoint = useMemo(() => 'https://api.mainnet-beta.solana.com', []);
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <WalletConnection />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};