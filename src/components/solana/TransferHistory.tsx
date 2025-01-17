import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TransferStatus {
  id: string;
  status: string;
  created_at: string;
  from_type: string;
  to_type: string;
  amount: number;
  token_mint: string;
  error_message?: string;
}

export function TransferHistory() {
  const { data: recentTransfers } = useQuery({
    queryKey: ['solana-transfers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('solana_transfers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as TransferStatus[];
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'text-green-500';
      case 'pending':
        return 'text-yellow-500';
      case 'failed':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <ScrollArea className="h-[200px] w-full rounded-md">
      <div className="space-y-2">
        {recentTransfers?.map((transfer) => (
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
            </div>
            <div className={`text-sm font-medium ${getStatusColor(transfer.status)}`}>
              {transfer.status}
              {transfer.error_message && (
                <p className="text-xs text-red-500">{transfer.error_message}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}