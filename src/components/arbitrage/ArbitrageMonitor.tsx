import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { findArbitrageOpportunities } from "@/utils/exchanges/arbitrage";
import { useToast } from "@/hooks/use-toast";
import type { ArbitrageOpportunity } from "@/utils/types/exchange";
import type { ArbitrageSettings } from "@/types/arbitrage";

interface ArbitrageMonitorProps {
  settings: ArbitrageSettings;
  onOpportunitiesFound: (opportunities: ArbitrageOpportunity[]) => void;
}

export function ArbitrageMonitor({ settings, onOpportunitiesFound }: ArbitrageMonitorProps) {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const monitorTradingPair = async (tradingPair: any) => {
      if (!isMounted || !isMonitoring) return;

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
          onOpportunitiesFound(filteredOpportunities);

          if (settings.notifications_enabled) {
            toast({
              title: "New Arbitrage Opportunities",
              description: `Found ${filteredOpportunities.length} opportunities for ${tradingPair.symbol}`,
            });
          }
        }

        // Wait for 30 seconds before checking the next pair
        timeoutId = setTimeout(() => {
          if (isMounted && isMonitoring) {
            monitorTradingPair(tradingPair);
          }
        }, 30000);

      } catch (error: any) {
        console.error(`Error monitoring ${tradingPair.symbol}:`, error);
        toast({
          title: "Error",
          description: error.message || `Failed to monitor ${tradingPair.symbol}`,
          variant: "destructive",
        });

        // Even on error, wait 30 seconds before retrying
        timeoutId = setTimeout(() => {
          if (isMounted && isMonitoring) {
            monitorTradingPair(tradingPair);
          }
        }, 30000);
      }
    };

    const startMonitoring = async () => {
      try {
        const { data: tradingPairs, error } = await supabase
          .from('matching_trading_pairs')
          .select('*')
          .eq('is_active', true);

        if (error) throw error;

        if (!tradingPairs || tradingPairs.length === 0) {
          console.log('No active trading pairs found');
          return;
        }

        setIsMonitoring(true);
        tradingPairs.forEach(pair => {
          monitorTradingPair(pair);
        });

      } catch (error: any) {
        console.error("Error starting monitoring:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to start monitoring",
          variant: "destructive",
        });
      }
    };

    startMonitoring();

    return () => {
      isMounted = false;
      setIsMonitoring(false);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [settings, toast, onOpportunitiesFound]);

  return null;
}