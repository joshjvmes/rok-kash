import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { fetchTrades } from "@/utils/exchanges/ccxt";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface TradingHistoryProps {
  exchange: string;
  symbol: string;
}

export function TradingHistory({ exchange, symbol }: TradingHistoryProps) {
  const { toast } = useToast();

  // Query for user trades from the database
  const { data: userTrades = [], isLoading: isLoadingUserTrades } = useQuery({
    queryKey: ['userTrades', exchange, symbol],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_trades')
        .select('*')
        .eq('exchange', exchange)
        .eq('symbol', symbol)
        .order('timestamp', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching user trades:', error);
        throw error;
      }

      return data || [];
    },
  });

  // Query for live trades to store in database
  const { data: liveTrades = [] } = useQuery({
    queryKey: ['liveTrades', exchange, symbol],
    queryFn: async () => {
      const trades = await fetchTrades(exchange, symbol);
      return Array.isArray(trades) ? trades : [];
    },
    refetchInterval: 10000, // Fetch every 10 seconds
  });

  // Store new trades in the database
  useEffect(() => {
    const storeTrades = async () => {
      if (liveTrades.length === 0) return;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log('User not authenticated');
          return;
        }

        const newTrades = liveTrades.map(trade => ({
          user_id: user.id,
          exchange,
          symbol,
          side: trade.side,
          price: trade.price,
          amount: trade.amount,
          timestamp: new Date(trade.timestamp).toISOString(),
          trade_id: trade.id || `${trade.timestamp}-${trade.price}-${trade.amount}`,
        }));

        const { error } = await supabase
          .from('user_trades')
          .upsert(newTrades, {
            onConflict: 'exchange,trade_id',
          });

        if (error) {
          console.error('Error storing trades:', error);
          toast({
            variant: "destructive",
            title: "Error storing trades",
            description: "Failed to store recent trades in database"
          });
        }
      } catch (error) {
        console.error('Error in storeTrades:', error);
      }
    };

    storeTrades();
  }, [liveTrades, exchange, symbol, toast]);

  if (isLoadingUserTrades) {
    return (
      <Card className="p-4 bg-serenity-sky-dark/10 border-serenity-sky-light/30">
        <p className="text-sm text-serenity-mountain">Loading trading history...</p>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-serenity-sky-dark/10 border-serenity-sky-light/30 backdrop-blur-sm">
      <h3 className="text-lg font-semibold mb-4 text-serenity-mountain">{symbol} Your Recent Trades</h3>
      <ScrollArea className="h-[300px] pr-4">
        <div className="space-y-2">
          {userTrades.map((trade: any) => (
            <div
              key={trade.id}
              className="flex justify-between text-sm border-b border-serenity-sky-light/20 pb-2 hover:bg-serenity-sky-light/10 rounded-sm px-2 py-1 transition-colors"
            >
              <span className={trade.side === 'buy' ? 'text-serenity-grass-light font-medium' : 'text-trading-red font-medium'}>
                {trade.side.toUpperCase()}
              </span>
              <span className="text-serenity-mountain">${Number(trade.price).toFixed(2)}</span>
              <span className="text-serenity-mountain">{Number(trade.amount).toFixed(4)}</span>
              <span className="text-serenity-mountain/70">
                {new Date(trade.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
          {userTrades.length === 0 && (
            <p className="text-sm text-serenity-mountain/70 text-center py-4">No trades available</p>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}