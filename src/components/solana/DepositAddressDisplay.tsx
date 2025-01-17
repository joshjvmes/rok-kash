import { useWallet } from '@solana/wallet-adapter-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const DepositAddressDisplay = () => {
  const { publicKey, connected } = useWallet();
  const { toast } = useToast();

  const copyToClipboard = async () => {
    if (publicKey) {
      try {
        await navigator.clipboard.writeText(publicKey.toString());
        toast({
          title: "Address Copied",
          description: "Deposit address has been copied to clipboard",
        });
      } catch (error) {
        console.error('Failed to copy address:', error);
        toast({
          title: "Error",
          description: "Failed to copy address to clipboard",
          variant: "destructive",
        });
      }
    }
  };

  if (!connected || !publicKey) {
    return (
      <Card className="p-4">
        <p className="text-sm text-muted-foreground">
          Connect your wallet to view deposit address
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Your Deposit Address</h3>
        <div className="flex items-center gap-2">
          <code className="flex-1 bg-muted p-2 rounded text-sm break-all">
            {publicKey.toString()}
          </code>
          <Button
            variant="outline"
            size="sm"
            onClick={copyToClipboard}
            className="flex items-center gap-2"
          >
            <Copy className="h-4 w-4" />
            Copy
          </Button>
        </div>
      </div>
    </Card>
  );
};