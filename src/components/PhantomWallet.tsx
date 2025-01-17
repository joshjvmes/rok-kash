import { FC, useEffect } from 'react';
import { useWeb3React } from '@web3-react/core';
import { InjectedConnector } from '@web3-react/injected-connector';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';

const injected = new InjectedConnector({
  supportedChainIds: [1, 2], // Solana chain IDs
});

export const PhantomWallet: FC = () => {
  const { activate, deactivate, active, account, error } = useWeb3React();
  const { toast } = useToast();

  useEffect(() => {
    if (error) {
      console.error('Wallet connection error:', error);
      toast({
        title: "Connection Error",
        description: "Failed to connect to Phantom wallet. Please make sure it's installed and try again.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  useEffect(() => {
    if (active && account) {
      console.info('Wallet connected successfully:', account);
      toast({
        title: "Wallet Connected",
        description: "Successfully connected to Phantom wallet",
        variant: "default",
      });
    }
  }, [active, account, toast]);

  const connectWallet = async () => {
    try {
      console.log('Attempting to connect to Phantom wallet...');
      await activate(injected);
    } catch (err) {
      console.error('Failed to connect:', err);
      toast({
        title: "Connection Failed",
        description: "Could not connect to Phantom wallet",
        variant: "destructive",
      });
    }
  };

  const disconnectWallet = () => {
    try {
      console.log('Disconnecting wallet...');
      deactivate();
      toast({
        title: "Wallet Disconnected",
        description: "Successfully disconnected from Phantom wallet",
      });
    } catch (err) {
      console.error('Failed to disconnect:', err);
      toast({
        title: "Disconnect Failed",
        description: "Could not disconnect from wallet",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex items-center gap-2">
      {!active ? (
        <Button 
          onClick={connectWallet}
          className="bg-purple-600 hover:bg-purple-700"
        >
          Connect Phantom
        </Button>
      ) : (
        <>
          <span className="text-sm text-gray-600">
            {account?.slice(0, 6)}...{account?.slice(-4)}
          </span>
          <Button 
            variant="destructive" 
            onClick={disconnectWallet}
            className="h-[48px]"
          >
            Disconnect
          </Button>
        </>
      )}
    </div>
  );
};