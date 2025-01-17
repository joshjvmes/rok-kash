import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface TradingHistoryProps {
  exchange: string;
  symbol: string;
}

interface Trade {
  id: string;
  exchange: string;
  symbol: string;
  side: string;
  price: number;
  amount: number;
  timestamp: string;
}

export function TradingHistory({ exchange, symbol }: TradingHistoryProps) {
  const { data: trades = [], isLoading } = useQuery({
    queryKey: ['user-trades', exchange, symbol],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_trades')
        .select('*')
        .eq('exchange', exchange)
        .eq('symbol', symbol)
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('Error fetching trades:', error);
        throw error;
      }

      return data as Trade[];
    },
  });

  if (isLoading) {
    return (
      <Card className="p-4 bg-serenity-sky-dark/10 border-serenity-sky-light/30">
        <div className="flex items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin text-serenity-sky-dark" />
          <p className="text-sm text-serenity-mountain ml-2">Loading trading history...</p>
        </div>
      </Card>
    );
  }

  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString()
    };
  };

  return (
    <Card className="p-4 bg-serenity-sky-dark/10 border-serenity-sky-light/30 backdrop-blur-sm">
      <h3 className="text-lg font-semibold mb-4 text-serenity-mountain">Your {symbol} Trade History</h3>
      <ScrollArea className="h-[300px] pr-4">
        <div className="space-y-2">
          {trades.map((trade) => {
            const { date, time } = formatDateTime(trade.timestamp);
            return (
              <div
                key={trade.id}
                className="flex justify-between text-sm border-b border-serenity-sky-light/20 pb-2 hover:bg-serenity-sky-light/10 rounded-sm px-2 py-1 transition-colors"
              >
                <span className={trade.side === 'buy' ? 'text-serenity-grass-light font-medium' : 'text-trading-red font-medium'}>
                  {trade.side.toUpperCase()}
                </span>
                <span className="text-serenity-mountain">${Number(trade.price).toFixed(2)}</span>
                <span className="text-serenity-mountain">{Number(trade.amount).toFixed(4)}</span>
                <div className="text-serenity-mountain/70 text-right">
                  <div>{date}</div>
                  <div>{time}</div>
                </div>
              </div>
            );
          })}
          {trades.length === 0 && (
            <p className="text-sm text-serenity-mountain/70 text-center py-4">No trade history available</p>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}