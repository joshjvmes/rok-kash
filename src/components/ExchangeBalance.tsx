import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { fetchBalance } from "@/utils/exchanges/ccxt";
import { Loader2, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ExchangeBalanceProps {
  exchange: string;
}

export function ExchangeBalance({ exchange }: ExchangeBalanceProps) {
  const { toast } = useToast();
  const { data: balance, isLoading, error, refetch } = useQuery({
    queryKey: ['balance', exchange],
    queryFn: () => fetchBalance(exchange),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const handleTestConnection = async () => {
    try {
      await refetch();
      toast({
        title: "Connection Test",
        description: `Successfully connected to ${exchange}`,
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: `Failed to connect to ${exchange}`,
        variant: "destructive",
      });
    }
  };

  const handleFetchBalance = async () => {
    try {
      await refetch();
      toast({
        title: "Balance Updated",
        description: `Successfully fetched ${exchange} balance`,
      });
    } catch (error) {
      toast({
        title: "Balance Update Failed",
        description: `Failed to fetch ${exchange} balance`,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card className="p-4 bg-trading-gray">
        <div className="flex items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin" />
          <p className="text-sm text-gray-400 ml-2">Loading balance...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-4 bg-trading-gray">
        <p className="text-sm text-red-400">Error loading balance</p>
      </Card>
    );
  }

  // Get all coins with non-zero balances
  const nonZeroBalances = balance?.total ? 
    Object.entries(balance.total)
      .filter(([_, amount]) => amount > 0)
      .sort(([coinA], [coinB]) => coinA.localeCompare(coinB)) : [];

  return (
    <Card className="p-4 bg-trading-gray">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold capitalize">{exchange}</h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>API Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={handleTestConnection}>
              Test Connection
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleFetchBalance}>
              Fetch Balance
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <ScrollArea className="h-[200px] pr-4">
        <div className="space-y-2">
          {nonZeroBalances.length > 0 ? (
            nonZeroBalances.map(([coin, amount]) => (
              <div key={coin} className="flex justify-between text-sm">
                <span className="text-gray-400">{coin}</span>
                <span>{Number(amount).toFixed(8)}</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-400">No balance found</p>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}