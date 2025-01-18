import { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWallet } from '@solana/wallet-adapter-react';

interface DepositAddressDisplayProps {
  exchange?: string;
  tokenMint?: string;
  show?: boolean;
  fromType: 'wallet' | 'exchange';
  toType: 'exchange' | 'wallet';
}

export function DepositAddressDisplay({ exchange, tokenMint, show = false, fromType, toType }: DepositAddressDisplayProps) {
  const [depositAddress, setDepositAddress] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { publicKey } = useWallet();

  useEffect(() => {
    async function fetchDepositAddress() {
      if (!exchange || !tokenMint || !show) return;
      
      // Only fetch exchange deposit address when transferring from wallet to exchange
      if (fromType === 'wallet' && toType === 'exchange') {
        setIsLoading(true);
        try {
          const { data, error } = await supabase.functions.invoke('solana-transfer', {
            body: {
              action: 'getDepositAddress',
              exchange,
              tokenMint,
            }
          });

          if (error) throw error;
          setDepositAddress(data.address);
        } catch (error) {
          console.error('Error fetching deposit address:', error);
          toast({
            title: "Error",
            description: "Failed to fetch deposit address. Please try again.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      }
    }

    // When transferring from exchange to wallet, use the connected wallet's address
    if (fromType === 'exchange' && toType === 'wallet' && publicKey) {
      setDepositAddress(publicKey.toString());
    }

    fetchDepositAddress();
  }, [exchange, tokenMint, show, fromType, toType, publicKey, toast]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(depositAddress);
      toast({
        title: "Address Copied",
        description: `${fromType === 'wallet' ? 'Exchange deposit' : 'Wallet'} address copied to clipboard`,
      });
    } catch (error) {
      console.error('Error copying address:', error);
      toast({
        title: "Error",
        description: "Failed to copy address",
        variant: "destructive",
      });
    }
  };

  if (!show) return null;

  const title = fromType === 'wallet' ? 'Exchange Deposit Address' : 'Destination Wallet Address';

  return (
    <Card className="p-4 bg-serenity-white/50 backdrop-blur-sm">
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-serenity-mountain">{title}</h3>
        {isLoading ? (
          <div className="flex items-center justify-center p-2">
            <Loader2 className="h-4 w-4 animate-spin text-serenity-sky-dark" />
            <span className="ml-2 text-sm text-serenity-mountain">Loading address...</span>
          </div>
        ) : depositAddress ? (
          <div className="flex items-center justify-between bg-white/50 p-2 rounded-md">
            <code className="text-sm text-serenity-mountain break-all">{depositAddress}</code>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="ml-2"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <p className="text-sm text-serenity-mountain/60">No address available</p>
        )}
      </div>
    </Card>
  );
}