import { useWallet } from '@solana/wallet-adapter-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TransferForm } from './solana/TransferForm';
import { TransferHistory } from './solana/TransferHistory';

export function SolanaTokenTransfer() {
  const { publicKey } = useWallet();
  const { toast } = useToast();

  const handleTransfer = async (transferData: {
    fromType: 'wallet' | 'exchange';
    toType: 'exchange' | 'wallet';
    selectedExchange: string;
    amount: string;
    tokenMint: string;
  }) => {
    try {
      // Get the current user's ID
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Prepare transfer data
      const data = {
        fromType: transferData.fromType,
        toType: transferData.toType,
        fromAddress: transferData.fromType === 'wallet' ? publicKey?.toString() : transferData.selectedExchange,
        toAddress: transferData.toType === 'wallet' ? publicKey?.toString() : transferData.selectedExchange,
        tokenMint: transferData.tokenMint,
        amount: parseFloat(transferData.amount),
      };

      // Call the transfer edge function
      const { data: functionResponse, error: functionError } = await supabase.functions.invoke('solana-transfer', {
        body: data
      });

      if (functionError) throw functionError;

      // Record the transfer in the database
      const { error: dbError } = await supabase.from('solana_transfers').insert({
        user_id: user.id,
        from_type: transferData.fromType,
        to_type: transferData.toType,
        from_address: data.fromAddress,
        to_address: data.toAddress,
        token_mint: transferData.tokenMint,
        amount: parseFloat(transferData.amount),
        status: functionResponse.status,
      });

      if (dbError) throw dbError;

      toast({
        title: "Transfer initiated",
        description: functionResponse.message || "Your transfer request has been recorded",
      });
    } catch (error) {
      console.error('Transfer error:', error);
      toast({
        title: "Transfer failed",
        description: error.message || "There was an error initiating the transfer",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Transfer Tokens</CardTitle>
          <CardDescription>Move tokens between your wallet and exchanges</CardDescription>
        </CardHeader>
        <CardContent>
          <TransferForm onTransferSubmit={handleTransfer} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transfers</CardTitle>
          <CardDescription>Monitor your recent transfer activities</CardDescription>
        </CardHeader>
        <CardContent>
          <TransferHistory />
        </CardContent>
      </Card>
    </div>
  );
}