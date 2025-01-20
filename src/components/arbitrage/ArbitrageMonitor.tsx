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
        console.log('Fetching arbitrage opportunities...');
        
        const { data: opportunities, error } = await supabase.functions.invoke(
          'compare-exchange-prices',
          {
            body: { symbols: settings.symbols }
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

          if (meetsSpreadRequirement && meetsProfitRequirement && exchangesEnabled) {
            console.log('Opportunity meets minimum requirements - adding to list');
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