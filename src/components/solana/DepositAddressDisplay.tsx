import { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DepositAddressDisplayProps {
  exchange?: string;
  tokenMint?: string;
  show?: boolean;
}

export function DepositAddressDisplay({ exchange, tokenMint, show = false }: DepositAddressDisplayProps) {
  const [depositAddress, setDepositAddress] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchDepositAddress() {
      if (!exchange || !tokenMint || !show) return;

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

    fetchDepositAddress();
  }, [exchange, tokenMint, show, toast]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(depositAddress);
      toast({
        title: "Address Copied",
        description: "Deposit address copied to clipboard",
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

  return (
    <Card className="p-4 bg-serenity-white/50 backdrop-blur-sm">
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-serenity-mountain">Deposit Address</h3>
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
          <p className="text-sm text-serenity-mountain/60">No deposit address available</p>
        )}
      </div>
    </Card>
  );
}