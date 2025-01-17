import { ArbitrageOpportunity } from "@/components/ArbitrageOpportunity";
import { ArbitrageSettings } from "@/components/trading/ArbitrageSettings";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { findArbitrageOpportunities } from "@/utils/exchanges/arbitrage";
import type { ArbitrageOpportunity as ArbitrageOpportunityType } from "@/utils/types/exchange";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ArbitrageSettings {
  symbols: string[];
  min_spread_percentage: number;
  min_profit_amount: number;
  exchanges: string[];
  refresh_interval: number;
  notifications_enabled: boolean;
}

const DEFAULT_SETTINGS: ArbitrageSettings = {
  symbols: ["BTC/USDT"],
  min_spread_percentage: 0.1,
  min_profit_amount: 10.0,
  exchanges: ["Binance", "Kucoin"],
  refresh_interval: 30,
  notifications_enabled: true,
};

export default function PureArbitrage() {
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunityType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<ArbitrageSettings>(DEFAULT_SETTINGS);
  const [currentPairIndex, setCurrentPairIndex] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const monitorTradingPair = async (tradingPair: any) => {
      try {
        console.log(`Checking pair: ${tradingPair.symbol}`);
        const pairOpportunities = await findArbitrageOpportunities(tradingPair.symbol);
        
        if (!isMounted) return;

        const filteredOpportunities = pairOpportunities.filter(opp => 
          opp.spread >= settings.min_spread_percentage &&
          opp.potential >= settings.min_profit_amount &&
          settings.exchanges.includes(opp.buyExchange) &&
          settings.exchanges.includes(opp.sellExchange)
        );

        if (filteredOpportunities.length > 0) {
          setOpportunities(prev => [...prev, ...filteredOpportunities]);

          if (settings.notifications_enabled) {
            toast({
              title: "New Arbitrage Opportunities",
              description: `Found ${filteredOpportunities.length} opportunities for ${tradingPair.symbol}`,
            });
          }
        }
      } catch (error: any) {
        console.error(`Error monitoring ${tradingPair.symbol}:`, error);
        toast({
          title: "Error",
          description: error.message || `Failed to monitor ${tradingPair.symbol}`,
          variant: "destructive",
        });
      }
    };

    const fetchStoredOpportunities = async () => {
      try {
        const { data: storedOpportunities, error: fetchError } = await supabase
          .from('arbitrage_opportunities')
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;

        const formattedOpportunities = storedOpportunities?.map(opp => ({
          buyExchange: opp.buy_exchange,
          sellExchange: opp.sell_exchange,
          symbol: opp.symbol,
          spread: Number(opp.spread),
          potential: Number(opp.potential_profit)
        })) || [];

        if (isMounted) {
          setOpportunities(formattedOpportunities);
        }
      } catch (error) {
        console.error("Error fetching stored opportunities:", error);
      }
    };

    const startMonitoring = async () => {
      try {
        setIsLoading(true);
        await fetchStoredOpportunities();

        const { data: tradingPairs, error } = await supabase
          .from('matching_trading_pairs')
          .select('*')
          .eq('is_active', true);

        if (error) throw error;

        if (!tradingPairs || tradingPairs.length === 0) {
          console.log('No active trading pairs found');
          setOpportunities([]);
          return;
        }

        const checkNextPair = () => {
          if (!isMounted) return;

          const currentPair = tradingPairs[currentPairIndex];
          if (currentPair) {
            monitorTradingPair(currentPair);
            setCurrentPairIndex(prevIndex => 
              (prevIndex + 1) % tradingPairs.length
            );
          }

          // Schedule next pair check after 10 seconds
          timeoutId = setTimeout(checkNextPair, 10000);
        };

        checkNextPair();
      } catch (error: any) {
        console.error("Error starting monitoring:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to start monitoring",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    startMonitoring();

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [settings, toast, currentPairIndex]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Pure Arbitrage</h1>
        <ArbitrageSettings />
      </div>
      <Card className="p-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Live Opportunities</h2>
          {isLoading ? (
            <p>Loading opportunities...</p>
          ) : opportunities.length > 0 ? (
            opportunities.map((opportunity) => (
              <ArbitrageOpportunity
                key={`${opportunity.buyExchange}-${opportunity.sellExchange}-${opportunity.symbol}`}
                {...opportunity}
              />
            ))
          ) : (
            <p>No arbitrage opportunities found</p>
          )}
        </div>
      </Card>
    </div>
  );
}