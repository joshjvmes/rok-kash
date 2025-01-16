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
    }
  }, [connecting]);

  useEffect(() => {
    if (connected) {
      console.info('Wallet connected successfully');
      toast({
        title: "Wallet Connected",
        description: "Successfully connected to Phantom wallet",
      });
    }
  }, [connected, toast]);

  useEffect(() => {
    if (!connected && !connecting && wallet) {
      console.error('Wallet disconnected');
    }
  }, [connected, connecting, wallet]);

  return (
    <div className="flex items-center gap-2">
      <WalletMultiButton className="phantom-button" />
      {connected && (
        <Button 
          variant="destructive" 
          onClick={() => disconnect()}
          className="h-[48px]"
        >
          Disconnect
        </Button>
      )}
    </div>
  );
};

export const PhantomWallet: FC = () => {
  // Set to 'devnet' or 'mainnet-beta' as needed
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