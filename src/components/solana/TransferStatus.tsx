import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';

interface TransferRecord {
  id: string;
  status: string;
  created_at: string;
  from_type: string;
  to_type: string;
  amount: number;
  token_mint: string;
  error_message?: string;
}

export function TransferStatus() {
  const { data: transfers } = useQuery({
    queryKey: ['solana-transfers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('solana_transfers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as TransferRecord[];
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <ScrollArea className="h-[200px] w-full rounded-md">
      <div className="space-y-2">
        {transfers?.map((transfer) => (
          <div
            key={transfer.id}
            className="flex items-center justify-between border-b border-gray-100 py-2"
          >
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {transfer.from_type} → {transfer.to_type}
              </p>
              <p className="text-xs text-gray-500">
                Amount: {transfer.amount} ({transfer.token_mint.slice(0, 8)}...)
              </p>
              <p className="text-xs text-gray-400">
                {format(new Date(transfer.created_at), 'MMM d, yyyy HH:mm')}
              </p>
            </div>
            <div className="text-right">
              <Badge className={getStatusColor(transfer.status)}>
                {transfer.status}
              </Badge>
              {transfer.error_message && (
                <p className="text-xs text-red-500 mt-1">{transfer.error_message}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}