import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ArbitrageOpportunity } from "@/utils/types/exchange";
import type { ArbitrageSettings } from "@/types/arbitrage";

interface ArbitrageMonitorProps {
  settings: ArbitrageSettings;
  onOpportunitiesFound: (opportunities: ArbitrageOpportunity[]) => void;
}

export function ArbitrageMonitor({ settings, onOpportunitiesFound }: ArbitrageMonitorProps) {
  useEffect(() => {
    const checkArbitrageOpportunities = async () => {
      try {
        console.log('Fetching arbitrage opportunities across all exchanges...');
        
        // Call the edge function without specific symbols to check all pairs
        const { data: opportunities, error } = await supabase.functions.invoke(
          'compare-exchange-prices',
          {
            body: { 
              exchanges: settings.exchanges,
              checkAllPairs: true
            }
          }
        );

        if (error) {
          console.error('Error fetching opportunities:', error);
          return;
        }

        // Filter opportunities based on settings
        const validOpportunities = opportunities.filter((opp: ArbitrageOpportunity) => {
          const meetsSpreadRequirement = opp.spread >= settings.min_spread_percentage;
          const meetsProfitRequirement = opp.potential >= settings.min_profit_amount;
          const exchangesEnabled = settings.exchanges.includes(opp.buyExchange) && 
                                 settings.exchanges.includes(opp.sellExchange);
          
          // Skip excluded symbols if any are specified
          if (settings.excluded_symbols?.length > 0) {
            const isExcluded = settings.excluded_symbols.some(
              symbol => opp.symbol.includes(symbol)
            );
            if (isExcluded) return false;
          }

          // Check included symbols if specified
          if (settings.included_symbols?.length > 0) {
            const isIncluded = settings.included_symbols.some(
              symbol => opp.symbol.includes(symbol)
            );
            if (!isIncluded) return false;
          }

          if (meetsSpreadRequirement && meetsProfitRequirement && exchangesEnabled) {
            console.log(`Found valid opportunity: ${opp.buyExchange} -> ${opp.sellExchange} | ${opp.symbol} | Spread: ${opp.spread}% | Potential: $${opp.potential}`);
            return true;
          }
          return false;
        });

        console.log(`Found ${validOpportunities.length} valid arbitrage opportunities that meet minimum requirements`);
        onOpportunitiesFound(validOpportunities);

      } catch (error) {
        console.error('Error in checkArbitrageOpportunities:', error);
      }
    };

    // Initial check
    checkArbitrageOpportunities();

    // Set up interval for periodic checks
    const interval = setInterval(
      checkArbitrageOpportunities,
      settings.refresh_interval * 1000
    );

    return () => clearInterval(interval);
  }, [settings, onOpportunitiesFound]);

  return null;
}