import { useState, useEffect } from "react";
import { ArbitrageSettings } from "@/components/trading/ArbitrageSettings";
import { ArbitrageMonitor } from "@/components/arbitrage/ArbitrageMonitor";
import { OpportunitiesList } from "@/components/arbitrage/OpportunitiesList";
import { supabase } from "@/integrations/supabase/client";
import type { ArbitrageOpportunity } from "@/utils/types/exchange";
import type { ArbitrageSettings as ArbitrageSettingsType } from "@/types/arbitrage";

const DEFAULT_SETTINGS: ArbitrageSettingsType = {
  symbols: ["BTC/USDT"],
  min_spread_percentage: 0.1,
  min_profit_amount: 10.0,
  exchanges: ["Binance", "Kucoin"],
  refresh_interval: 30,
  notifications_enabled: true,
};

export default function PureArbitrage() {
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<ArbitrageSettingsType>(DEFAULT_SETTINGS);

  useEffect(() => {
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

        setOpportunities(formattedOpportunities);
      } catch (error) {
        console.error("Error fetching stored opportunities:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStoredOpportunities();
  }, []);

  const handleNewOpportunities = (newOpportunities: ArbitrageOpportunity[]) => {
    console.log("Received new opportunities:", newOpportunities);
    setOpportunities(prev => {
      // Filter out duplicates based on symbol and exchanges
      const existing = new Set(prev.map(o => 
        `${o.buyExchange}-${o.sellExchange}-${o.symbol}`
      ));
      
      const filtered = newOpportunities.filter(opp => 
        !existing.has(`${opp.buyExchange}-${opp.sellExchange}-${opp.symbol}`)
      );

      return [...filtered, ...prev];
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Pure Arbitrage</h1>
        <ArbitrageSettings />
      </div>
      <ArbitrageMonitor 
        settings={settings}
        onOpportunitiesFound={handleNewOpportunities}
      />
      <OpportunitiesList 
        opportunities={opportunities}
        isLoading={isLoading}
      />
    </div>
  );
}