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
  const { toast } = useToast();

  // Fetch active trading pairs and monitor them
  useEffect(() => {
    const monitorTradingPairs = async () => {
      try {
        setIsLoading(true);
        
        // Fetch active trading pairs from the database
        const { data: tradingPairs, error } = await supabase
          .from('matching_trading_pairs')
          .select('symbol')
          .eq('is_active', true);

        if (error) throw error;

        if (!tradingPairs || tradingPairs.length === 0) {
          console.log('No active trading pairs found');
          setOpportunities([]);
          return;
        }

        // Check for arbitrage opportunities for each pair
        const allOpportunities: ArbitrageOpportunityType[] = [];
        for (const pair of tradingPairs) {
          const pairOpportunities = await findArbitrageOpportunities(pair.symbol);
          allOpportunities.push(...pairOpportunities.filter(opp => 
            opp.spread >= settings.min_spread_percentage &&
            opp.potential >= settings.min_profit_amount &&
            settings.exchanges.includes(opp.buyExchange) &&
            settings.exchanges.includes(opp.sellExchange)
          ));
        }

        setOpportunities(allOpportunities);

        // Show notification if enabled and opportunities found
        if (settings.notifications_enabled && allOpportunities.length > 0) {
          toast({
            title: "New Arbitrage Opportunities",
            description: `Found ${allOpportunities.length} opportunities matching your criteria.`,
          });
        }
      } catch (error: any) {
        console.error("Error monitoring trading pairs:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to monitor trading pairs",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    // Initial monitoring
    monitorTradingPairs();

    // Set up interval based on settings
    const interval = setInterval(monitorTradingPairs, settings.refresh_interval * 1000);

    return () => clearInterval(interval);
  }, [settings, toast]);

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