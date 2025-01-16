import { FC, useEffect, useMemo } from 'react';
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';

const WalletConnection: FC = () => {
  const { connected, wallet, connecting, disconnect } = useWallet();
  const { toast } = useToast();

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
    if (connected && wallet) {
      console.info('Wallet connected successfully');
      toast({
        title: "Wallet Connected",
        description: "Successfully connected to Phantom wallet",
        variant: "default",
      });
    }
  }, [connected, wallet, toast]);

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
  // Set to 'devnet' for testing
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
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