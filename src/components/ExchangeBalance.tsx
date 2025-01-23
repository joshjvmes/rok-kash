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
  className?: string;
}

interface BalanceData {
  total: {
    [key: string]: number;
  };
}

interface BalanceItemProps {
  coin: string;
  amount: number;
  exchange: string;
}

// Separate component for balance item to avoid key prop access issues
const BalanceItem = ({ coin, amount, exchange }: BalanceItemProps) => (
  <div className="flex justify-between text-sm">
    <span className="text-serenity-mountain">{coin}</span>
    <span className="text-serenity-mountain font-medium">{Number(amount).toFixed(8)}</span>
  </div>
);

export function ExchangeBalance({ exchange, className }: ExchangeBalanceProps) {
  const { toast } = useToast();
  const { data: balance, isLoading, error, refetch } = useQuery<BalanceData>({
    queryKey: ['balance', exchange],
    queryFn: () => fetchBalance(exchange),
    refetchInterval: 360000, // 6 minutes
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
      <Card className="p-4 bg-serenity-white shadow-lg border border-serenity-sky-light">
        <div className="flex items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin text-serenity-sky-dark" />
          <p className="text-sm text-serenity-mountain ml-2">Loading balance...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-4 bg-serenity-white shadow-lg border border-serenity-sky-light">
        <p className="text-sm text-red-400">Error loading balance</p>
      </Card>
    );
  }

  const nonZeroBalances = balance?.total ? 
    Object.entries(balance.total)
      .filter(([_, amount]) => amount > 0)
      .sort(([coinA], [coinB]) => coinA.localeCompare(coinB)) : [];

  return (
    <Card className="relative p-4 bg-serenity-white shadow-lg border border-serenity-sky-light overflow-hidden">
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold capitalize text-serenity-mountain">{exchange}</h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 text-serenity-mountain hover:text-serenity-sky-dark">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-serenity-white border-serenity-sky-light">
              <DropdownMenuLabel className="text-serenity-mountain">API Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={handleTestConnection} className="text-serenity-mountain hover:bg-serenity-sky-light">
                Test Connection
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleFetchBalance} className="text-serenity-mountain hover:bg-serenity-sky-light">
                Fetch Balance
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <ScrollArea className="h-[200px] pr-4">
          <div className="space-y-2">
            {nonZeroBalances.length > 0 ? (
              nonZeroBalances.map(([coin, amount]) => (
                <BalanceItem
                  key={`${exchange}-${coin}`}
                  coin={coin}
                  amount={amount}
                  exchange={exchange}
                />
              ))
            ) : (
              <p className="text-sm text-serenity-mountain">No balance found</p>
            )}
          </div>
        </ScrollArea>
      </div>
      <div 
        className="absolute bottom-0 left-0 right-0 h-24 opacity-10"
        style={{
          backgroundImage: `url(/${exchange}-logo.png)`,
          backgroundPosition: 'center bottom',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'contain'
        }}
      />
    </Card>
  );
}