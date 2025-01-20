import { useEffect, useState, useCallback } from "react";
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

  const processOpportunities = useCallback(async (tradingPair: any) => {
    try {
      console.log(`Checking pair: ${tradingPair.symbol}`);
      const pairOpportunities = await findArbitrageOpportunities(tradingPair.symbol);
      
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
    } catch (error: any) {
      console.error(`Error monitoring ${tradingPair.symbol}:`, error);
      toast({
        title: "Error",
        description: error.message || `Failed to monitor ${tradingPair.symbol}`,
        variant: "destructive",
      });
    }
  }, [settings, toast, onOpportunitiesFound]);

  useEffect(() => {
    let isMounted = true;
    let timeoutIds: NodeJS.Timeout[] = [];

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

        // Process pairs sequentially with delay
        tradingPairs.forEach((pair, index) => {
          const timeoutId = setTimeout(() => {
            if (isMounted && isMonitoring) {
              processOpportunities(pair);
            }
          }, index * 5000); // 5 second delay between each pair
          timeoutIds.push(timeoutId);
        });

        // Set up the next round of checks
        const cycleTimeout = setTimeout(() => {
          if (isMounted && isMonitoring) {
            startMonitoring();
          }
        }, Math.max(settings.refresh_interval * 1000, tradingPairs.length * 5000));
        
        timeoutIds.push(cycleTimeout);

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
      timeoutIds.forEach(id => clearTimeout(id));
    };
  }, [settings, toast, processOpportunities, isMonitoring]);

  return null;
}